
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const NeuroFlashLedgerABI = {
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "admin",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AccessControlBadConfirmation",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "neededRole",
          "type": "bytes32"
        }
      ],
      "name": "AccessControlUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "DecryptDelegated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "EmblemMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "programId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "curator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "manifestCID",
          "type": "string"
        }
      ],
      "name": "ProgramScheduled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "analyst",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "verificationCID",
          "type": "string"
        }
      ],
      "name": "PulseAudited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "latencyMs",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "clearCID",
          "type": "string"
        }
      ],
      "name": "PulseExposed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "pilot",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "payloadHash",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "exposure",
          "type": "uint8"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "programId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "timestamp",
          "type": "uint64"
        }
      ],
      "name": "PulseRecorded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "previousAdminRole",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "newAdminRole",
          "type": "bytes32"
        }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleRevoked",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "ANALYST_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "CURATOR_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "verificationCID",
          "type": "string"
        }
      ],
      "name": "auditPulse",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "delegateDecrypt",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emblem",
      "outputs": [
        {
          "internalType": "contract NeuroFlashEmblem",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emblemAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "internalType": "uint64",
          "name": "latencyMs",
          "type": "uint64"
        },
        {
          "internalType": "string",
          "name": "clearCID",
          "type": "string"
        }
      ],
      "name": "exposePulse",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        }
      ],
      "name": "getRoleAdmin",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "emblemCID",
          "type": "string"
        }
      ],
      "name": "mintEmblemForPulse",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "programCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pulseCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "payloadHash",
              "type": "bytes32"
            },
            {
              "internalType": "string",
              "name": "artifactCID",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "latencyMs",
              "type": "uint64"
            },
            {
              "internalType": "uint8",
              "name": "protocolMode",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "exposure",
              "type": "uint8"
            },
            {
              "internalType": "uint256",
              "name": "programId",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "deviceFingerprint",
              "type": "bytes32"
            },
            {
              "internalType": "uint64",
              "name": "rounds",
              "type": "uint64"
            },
            {
              "internalType": "externalEuint64",
              "name": "sealedLatencyInput",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "sealedProof",
              "type": "bytes"
            }
          ],
          "internalType": "struct NeuroFlashLedger.RecordPulseParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "recordPulse",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "callerConfirmation",
          "type": "address"
        }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "manifestCID",
          "type": "string"
        },
        {
          "internalType": "uint64",
          "name": "windowStart",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "windowEnd",
          "type": "uint64"
        },
        {
          "internalType": "bytes32",
          "name": "rulesDigest",
          "type": "bytes32"
        }
      ],
      "name": "scheduleProgram",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "programId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        }
      ],
      "name": "sealedPulseValue",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "programId",
          "type": "uint256"
        }
      ],
      "name": "viewProgram",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "programId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "curator",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "manifestCID",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "windowStart",
              "type": "uint64"
            },
            {
              "internalType": "uint64",
              "name": "windowEnd",
              "type": "uint64"
            },
            {
              "internalType": "bytes32",
              "name": "rulesDigest",
              "type": "bytes32"
            }
          ],
          "internalType": "struct NeuroFlashLedger.NeuroProgram",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pulseId",
          "type": "uint256"
        }
      ],
      "name": "viewPulse",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "pulseId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "pilot",
              "type": "address"
            },
            {
              "internalType": "uint8",
              "name": "protocolMode",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "artifactCID",
              "type": "string"
            },
            {
              "internalType": "bytes32",
              "name": "payloadHash",
              "type": "bytes32"
            },
            {
              "internalType": "uint8",
              "name": "exposure",
              "type": "uint8"
            },
            {
              "internalType": "uint64",
              "name": "latencyMs",
              "type": "uint64"
            },
            {
              "internalType": "uint256",
              "name": "programId",
              "type": "uint256"
            },
            {
              "internalType": "uint64",
              "name": "submittedAt",
              "type": "uint64"
            },
            {
              "internalType": "bytes32",
              "name": "deviceFingerprint",
              "type": "bytes32"
            },
            {
              "internalType": "uint64",
              "name": "rounds",
              "type": "uint64"
            },
            {
              "internalType": "bool",
              "name": "validated",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "emblemTokenId",
              "type": "uint256"
            }
          ],
          "internalType": "struct NeuroFlashLedger.PulseView",
          "name": "rendered",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

