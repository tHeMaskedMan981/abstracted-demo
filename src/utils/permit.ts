import { CHAIN_SLUGS, ERC20_ABI, getProviders } from '@/constants';
import { ethers } from 'ethers';

export async function createPermitSignature(
    token: ethers.Contract,
    owner: string,
    spender: string,
    value: ethers.BigNumberish,
    deadline: ethers.BigNumberish,
    signer: ethers.Signer
) {

    const providers = getProviders();
    const provider = providers[CHAIN_SLUGS.ARBITRUM_SEPOLIA];
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
    console.log('Permit: using token address', token.address);
    console.log('Permit: using owner address', owner);
    console.log('Permit: using spender address', spender);
    console.log('Permit: using value', value);
    console.log('Permit: using deadline', deadline);
    const nonce = await tokenContract.nonces(owner);
    const name = await tokenContract.name();
    const version = "1";
    const network = CHAIN_SLUGS.ARBITRUM_SEPOLIA;
    const chainId = CHAIN_SLUGS.ARBITRUM_SEPOLIA;
    console.log({nonce, name, version, network, chainId});
    // Calculate EIP-712 signature
    const domain = {
        name,
        version,
        chainId,
        verifyingContract: tokenContract.address
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    const message = {
        owner,
        spender,
        value: value.toString(),
        nonce: nonce.toNumber(),
        deadline
    };
    console.log({message});
    // Get EIP-712 signature (ethers v5)
    //@ts-ignore
    const eip712Signature = await signer._signTypedData(domain, types, message);
    const eip712Split = ethers.utils.splitSignature(eip712Signature);

    try {
        await tokenContract.callStatic.permit(owner, spender, value, deadline, eip712Split.v, eip712Split.r, eip712Split.s);
        console.log("EIP-712 signature is valid");
    } catch (error) {        
        console.log("Error in eip712:", error);
    }

    return eip712Split;
}