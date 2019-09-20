import { assert } from '@0x/assert';
import { fetchAsync } from '@0x/utils';
import { JSONRPCRequestPayload, Provider } from 'ethereum-types';
import { Callback, ErrorCallback } from './types';
import { Subprovider } from '@0x/subproviders/lib/src/subproviders/subprovider';
import { StatusCodes } from '@0x/types';
import * as JsonRpcError from 'json-rpc-error/lib/errors';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine)
 * subprovider interface.
 * It passes remaining requests down to the injected provider i.e. MetaMask or a mobile wallet provider.
 */
export class PassthroughSubprovider extends Subprovider {
    private readonly _provider: Provider;
    /**
     * Instantiates a new PassthroughSubprovider
     * @param provider Web3 provider that should handle all remaining requests, i.e. MetaMask
     */
    constructor(provider: Provider) {
        super();

        if (!('sendAsync' in provider)) {
            (provider as any).sendAsync = function () {
                return this.send.apply(provider, arguments);
            };
        }
        
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
        try {
            this._provider.sendAsync(payload, function(error, result) {
                let realError;

                // This ensures that we end up with a proper Error object
                if (error) {
                    if ('message' in error) {
                        realError = error.message;
                    }
                    else {
                        realError = error;
                    }
                }
                else if (result && result.error) {
                    if ('message' in result.error) {
                        realError = result.error.message;
                    }
                    else {
                        realError = result.error;
                    }
                }

                if (realError) {
                    return end(new Error(realError), null);
                }

                if (!result || !result.result) {
                    // getTransactionByHash/getTransactionReceipt return null until found/valid so this is not an error
                    if (payload.method !== "eth_getTransactionByHash" && 
                        payload.method !== "eth_getTransactionReceipt") {
                        return end(new Error('Error performing ' + payload.method), null);
                    }
                }

                end(null, result.result);
            })
        } catch (err) {
            end(err);
        }
    }
    /**
     * This method conforms to the provider sendAsync interface.
     * Allowing the PassthroughSubprovider to be used as a generic provider (outside of Web3ProviderEngine)
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