# Signing Test

The purpose of this package is to test various signing method variations for the producing valid 0x order signatures.


## General Comments

A number of mobile-based wallets inject a web3 library directly into the page in a **\<script\>** tag. As a result any code that next to run post-injection needs to hook in after the **onload** event and with a respectable delay.
Injection also means a number of wallets will overwrite any global **Web3** library you may have included, so I've named this **MyWeb3Library** to avoid it being overwritten.

## Signing Methods

### eth_signedTypeData
This method calls ***eth_signedTypeData*** directly on the provider RPC interface, i.e. to spec with the `Address` and `TypedData` in the correct order.

### eth_signedTypeData_v3
This method uses the 0x [MetaMaskSubprovider](https://github.com/0xProject/0x-monorepo/blob/development/packages/subproviders/src/subproviders/metamask_subprovider.ts), which calls **eth_signTypedData_v3** on the provider RPC interface.

### eth_signedTypeData old draft
This method calls **eth_signedTypeData** directly on the provider RPC interface, with the parameters in the reverse order.

### personal_sign
This method rewrites **eth_sign**  calls to  **personal_sign**.

### eth_sign no prefix
This method just calls **eth_sign** as is.

### eth_sign with prefix
This method manually adds the `\x19Ethereum`.... prefix to the message passed to **eth_sign** .

