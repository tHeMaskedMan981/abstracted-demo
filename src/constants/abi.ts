export const APP_GATEWAY_ABI = [
	{
		"type": "constructor",
		"inputs": [
			{
				"name": "addressResolver_",
				"type": "address",
				"internalType": "address"
			},
			{ "name": "owner_", "type": "address", "internalType": "address" },
			{ "name": "fees_", "type": "uint256", "internalType": "uint256" },
			{
				"name": "params_",
				"type": "tuple",
				"internalType": "struct AbstractedSuperTokenAppGateway.ConstructorParams",
				"components": [
					{ "name": "name", "type": "string", "internalType": "string" },
					{ "name": "symbol", "type": "string", "internalType": "string" },
					{ "name": "decimals", "type": "uint8", "internalType": "uint8" },
					{ "name": "owner", "type": "address", "internalType": "address" },
					{
						"name": "initialSupply",
						"type": "uint256",
						"internalType": "uint256"
					}
				]
			}
		],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "abstractedSuperToken",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "addressResolver__",
		"inputs": [],
		"outputs": [
			{
				"name": "",
				"type": "address",
				"internalType": "contract IAddressResolver"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "asyncDeployer__",
		"inputs": [],
		"outputs": [
			{
				"name": "",
				"type": "address",
				"internalType": "contract IAsyncDeployer"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "auctionManager",
		"inputs": [],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "cancelOwnershipHandover",
		"inputs": [],
		"outputs": [],
		"stateMutability": "payable"
	},
	{
		"type": "function",
		"name": "completeOwnershipHandover",
		"inputs": [
			{ "name": "pendingOwner", "type": "address", "internalType": "address" }
		],
		"outputs": [],
		"stateMutability": "payable"
	},
	{
		"type": "function",
		"name": "consumeFrom",
		"inputs": [],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "creationCodeWithArgs",
		"inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"outputs": [{ "name": "", "type": "bytes", "internalType": "bytes" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "deployContracts",
		"inputs": [
			{
				"name": "originChainSlug_",
				"type": "uint32",
				"internalType": "uint32"
			},
			{
				"name": "dstChainSlugs_",
				"type": "uint32[]",
				"internalType": "uint32[]"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "deployForwarder__",
		"inputs": [],
		"outputs": [
			{
				"name": "",
				"type": "address",
				"internalType": "contract IDeployForwarder"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "depositWithPermit",
		"inputs": [
			{
				"name": "order",
				"type": "tuple",
				"internalType": "struct AbstractedSuperTokenAppGateway.VaultDepositOrder",
				"components": [
					{ "name": "chainSlug", "type": "uint32", "internalType": "uint32" },
					{ "name": "token", "type": "address", "internalType": "address" },
					{ "name": "user", "type": "address", "internalType": "address" },
					{ "name": "amount", "type": "uint256", "internalType": "uint256" },
					{
						"name": "deadline",
						"type": "uint256",
						"internalType": "uint256"
					},
					{ "name": "v", "type": "uint8", "internalType": "uint8" },
					{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
					{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
				]
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "feesManager__",
		"inputs": [],
		"outputs": [
			{
				"name": "",
				"type": "address",
				"internalType": "contract IFeesManager"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "forwarderAddresses",
		"inputs": [
			{ "name": "", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "", "type": "uint32", "internalType": "uint32" }
		],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "getOnChainAddress",
		"inputs": [
			{ "name": "contractId_", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "chainSlug_", "type": "uint32", "internalType": "uint32" }
		],
		"outputs": [
			{
				"name": "onChainAddress",
				"type": "address",
				"internalType": "address"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "getOverrideParams",
		"inputs": [],
		"outputs": [
			{
				"name": "",
				"type": "tuple",
				"internalType": "struct OverrideParams",
				"components": [
					{ "name": "callType", "type": "bytes4", "internalType": "bytes4" },
					{
						"name": "isParallelCall",
						"type": "uint8",
						"internalType": "enum Parallel"
					},
					{
						"name": "writeFinality",
						"type": "uint8",
						"internalType": "enum WriteFinality"
					},
					{
						"name": "gasLimit",
						"type": "uint256",
						"internalType": "uint256"
					},
					{ "name": "value", "type": "uint256", "internalType": "uint256" },
					{
						"name": "readAtBlockNumber",
						"type": "uint256",
						"internalType": "uint256"
					},
					{
						"name": "delayInSeconds",
						"type": "uint256",
						"internalType": "uint256"
					}
				]
			},
			{ "name": "", "type": "bytes32", "internalType": "bytes32" }
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "handleDeposit",
		"inputs": [
			{ "name": "data", "type": "bytes", "internalType": "bytes" },
			{ "name": "returnData", "type": "bytes", "internalType": "bytes" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "handleMint",
		"inputs": [
			{ "name": "data", "type": "bytes", "internalType": "bytes" },
			{ "name": "returnData", "type": "bytes", "internalType": "bytes" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "handleRevert",
		"inputs": [
			{ "name": "payloadId_", "type": "bytes32", "internalType": "bytes32" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "initializeOnChain",
		"inputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
		"outputs": [],
		"stateMutability": "pure"
	},
	{
		"type": "function",
		"name": "isAsyncModifierSet",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "isValidPromise",
		"inputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "lockedBalance",
		"inputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "maxFees",
		"inputs": [],
		"outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "mint",
		"inputs": [
			{ "name": "chainSlug_", "type": "uint32", "internalType": "uint32" },
			{ "name": "amount_", "type": "uint256", "internalType": "uint256" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "onCompleteData",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes", "internalType": "bytes" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "onRequestComplete",
		"inputs": [
			{ "name": "", "type": "uint40", "internalType": "uint40" },
			{ "name": "onCompleteData_", "type": "bytes", "internalType": "bytes" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "originChainSlug",
		"inputs": [],
		"outputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "originToken",
		"inputs": [],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "overrideParams",
		"inputs": [],
		"outputs": [
			{ "name": "callType", "type": "bytes4", "internalType": "bytes4" },
			{
				"name": "isParallelCall",
				"type": "uint8",
				"internalType": "enum Parallel"
			},
			{
				"name": "writeFinality",
				"type": "uint8",
				"internalType": "enum WriteFinality"
			},
			{ "name": "gasLimit", "type": "uint256", "internalType": "uint256" },
			{ "name": "value", "type": "uint256", "internalType": "uint256" },
			{
				"name": "readAtBlockNumber",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "delayInSeconds",
				"type": "uint256",
				"internalType": "uint256"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "owner",
		"inputs": [],
		"outputs": [
			{ "name": "result", "type": "address", "internalType": "address" }
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "ownershipHandoverExpiresAt",
		"inputs": [
			{ "name": "pendingOwner", "type": "address", "internalType": "address" }
		],
		"outputs": [
			{ "name": "result", "type": "uint256", "internalType": "uint256" }
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "renounceOwnership",
		"inputs": [],
		"outputs": [],
		"stateMutability": "payable"
	},
	{
		"type": "function",
		"name": "requestOwnershipHandover",
		"inputs": [],
		"outputs": [],
		"stateMutability": "payable"
	},
	{
		"type": "function",
		"name": "reset",
		"inputs": [],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "sbType",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "setAddress",
		"inputs": [
			{ "name": "data_", "type": "bytes", "internalType": "bytes" },
			{ "name": "returnData_", "type": "bytes", "internalType": "bytes" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "superToken",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "transferCredits",
		"inputs": [
			{ "name": "receiver_", "type": "address", "internalType": "address" },
			{ "name": "amount_", "type": "uint256", "internalType": "uint256" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "transferOwnership",
		"inputs": [
			{ "name": "newOwner", "type": "address", "internalType": "address" }
		],
		"outputs": [],
		"stateMutability": "payable"
	},
	{
		"type": "function",
		"name": "unmintedBalance",
		"inputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "vault",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "watcher__",
		"inputs": [],
		"outputs": [
			{ "name": "", "type": "address", "internalType": "contract IWatcher" }
		],
		"stateMutability": "view"
	},
	{
		"type": "event",
		"name": "DepositedToVault",
		"inputs": [
			{
				"name": "requestCount",
				"type": "uint40",
				"indexed": false,
				"internalType": "uint40"
			},
			{
				"name": "owner",
				"type": "address",
				"indexed": false,
				"internalType": "address"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "OwnershipHandoverCanceled",
		"inputs": [
			{
				"name": "pendingOwner",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "OwnershipHandoverRequested",
		"inputs": [
			{
				"name": "pendingOwner",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "OwnershipTransferred",
		"inputs": [
			{
				"name": "oldOwner",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			},
			{
				"name": "newOwner",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			}
		],
		"anonymous": false
	},
	{ "type": "error", "name": "AlreadyInitialized", "inputs": [] },
	{ "type": "error", "name": "ChainNotSupported", "inputs": [] },
	{ "type": "error", "name": "InsufficientBalance", "inputs": [] },
	{ "type": "error", "name": "InvalidPromise", "inputs": [] },
	{ "type": "error", "name": "NewOwnerIsZeroAddress", "inputs": [] },
	{ "type": "error", "name": "NoHandoverRequest", "inputs": [] },
	{ "type": "error", "name": "OnlyWatcherAllowed", "inputs": [] },
	{ "type": "error", "name": "Unauthorized", "inputs": [] },
	{ "type": "error", "name": "ZeroAmount", "inputs": [] }
]


export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', type: 'bytes32' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    name: 'permit',
    outputs: [],
    type: 'function',
  },
];

export const PERMIT_HELPER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "getSuperTokenPermitHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];