import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { JSONRPCRequestPayload, SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import { Callback, ErrorCallback } from './types';

import { Subprovider } from '@0x/subproviders';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine)
 * subprovider interface and the provider sendAsync interface.
 * It handles inconsistencies with Metamask implementations of various JSON RPC methods.
 * It forwards JSON RPC requests involving the domain of a signer (getAccounts,
 * sendTransaction, signMessage etc...) to the provider instance supplied at instantiation. All other requests
 * are passed onwards for subsequent subproviders to handle.
 */
export class EthSignAddPrefixSubprovider extends Subprovider {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: ZeroExProvider;
    /**
     * Instantiates a new MetamaskSubprovider
     * @param supportedProvider Web3 provider that should handle  all user account related requests
     */
    constructor(supportedProvider: SupportedProvider) {
        super();
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
    }
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:prefer-function-over-method async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, next: Callback, end: ErrorCallback): Promise<void> {
        let message;
        let address;
        switch (payload.method) {
            case 'eth_sign':
                [address, message] = payload.params;
                try {
                    const msgBuff = ethUtil.toBuffer(message);
                    const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
                    const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
                    const signature = await this._web3Wrapper.sendRawPayloadAsync<string>({
                        method: 'eth_sign',
                        params: [address, prefixedMsgHex],
                    });
                    signature ? end(null, signature) : end(new Error('Error performing eth_sign'), null);
                } catch (err) {
                    end(err);
                }
                return;
            default:
                next();
                return;
        }
    }
    /**
     * This method conforms to the provider sendAsync interface.
     * Allowing the MetamaskSubprovider to be used as a generic provider (outside of Web3ProviderEngine) with the
     * addition of wrapping the inconsistent Metamask behaviour
     * @param payload JSON RPC payload
     * @return The contents nested under the result key of the response body
     */
    public sendAsync(payload: JSONRPCRequestPayload, callback: ErrorCallback): void {
        void this.handleRequest(
            payload,
            // handleRequest has decided to not handle this, so fall through to the provider
            () => {
                const sendAsync = this._provider.sendAsync.bind(this._provider);
                sendAsync(payload, callback);
            },
            // handleRequest has called end and will handle this
            (err, data) => {
                err ? callback(err) : callback(null, { ...payload, result: data });
            },
        );
    }
}
