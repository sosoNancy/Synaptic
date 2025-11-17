// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title NeuroFlashEmblem
 * @notice Soulbound badge minted for curated NeuroFlash reflex attestations.
 */
contract NeuroFlashEmblem is ERC721, AccessControl {
    bytes32 public constant EMBLEM_MINTER_ROLE = keccak256("EMBLEM_MINTER_ROLE");
    uint256 private _nextId = 1;

    mapping(uint256 tokenId => string) private _tokenURI;

    constructor() ERC721("NeuroFlash Emblem", "NF-EMBLEM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function mintEmblem(address to, string calldata uri) external onlyRole(EMBLEM_MINTER_ROLE) returns (uint256 tokenId) {
        tokenId = _nextId++;
        _safeMint(to, tokenId);
        _tokenURI[tokenId] = uri;
    }

    function burn(uint256 tokenId) external onlyRole(EMBLEM_MINTER_ROLE) {
        _burn(tokenId);
        delete _tokenURI[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NeuroFlashEmblem: invalid token");
        return _tokenURI[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        if (previousOwner != address(0) && to != address(0)) {
            revert("NeuroFlashEmblem: non-transferable");
        }
        return previousOwner;
    }
}

/**
 * @title NeuroFlashLedger
 * @notice FHE-enabled registry for reaction latency attempts with privacy preserving flows.
 */
contract NeuroFlashLedger is ZamaEthereumConfig, AccessControl {
    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");
    bytes32 public constant ANALYST_ROLE = keccak256("ANALYST_ROLE");

    enum ExposureLevel {
        Shielded,
        Encrypted,
        Revealed
    }

    struct PulseInternal {
        address pilot;
        uint8 protocolMode;
        string artifactCID;
        bytes32 payloadHash;
        uint8 exposure;
        uint64 latencyMs;
        uint64 submittedAt;
        uint256 programId;
        euint64 sealedLatency;
        bytes32 deviceFingerprint;
        uint64 rounds;
        bool validated;
        uint256 emblemTokenId;
    }

    struct PulseView {
        uint256 pulseId;
        address pilot;
        uint8 protocolMode;
        string artifactCID;
        bytes32 payloadHash;
        uint8 exposure;
        uint64 latencyMs;
        uint256 programId;
        uint64 submittedAt;
        bytes32 deviceFingerprint;
        uint64 rounds;
        bool validated;
        uint256 emblemTokenId;
    }

    struct NeuroProgram {
        uint256 programId;
        address curator;
        string manifestCID;
        uint64 windowStart;
        uint64 windowEnd;
        bytes32 rulesDigest;
    }

    struct RecordPulseParams {
        bytes32 payloadHash;
        string artifactCID;
        uint64 latencyMs;
        uint8 protocolMode;
        uint8 exposure;
        uint256 programId;
        bytes32 deviceFingerprint;
        uint64 rounds;
        externalEuint64 sealedLatencyInput;
        bytes sealedProof;
    }

    event PulseRecorded(
        uint256 indexed pulseId,
        address indexed pilot,
        bytes32 payloadHash,
        uint8 exposure,
        uint256 indexed programId,
        uint64 timestamp
    );
    event ProgramScheduled(uint256 indexed programId, address indexed curator, string manifestCID);
    event PulseAudited(uint256 indexed pulseId, address indexed analyst, bool approved, string verificationCID);
    event EmblemMinted(uint256 indexed pulseId, uint256 indexed tokenId, address indexed to);
    event DecryptDelegated(uint256 indexed pulseId, address indexed to);
    event PulseExposed(uint256 indexed pulseId, uint64 latencyMs, string clearCID);

    uint256 private _pulseCounter;
    uint256 private _programCounter;

    mapping(uint256 pulseId => PulseInternal) private _pulses;
    mapping(uint256 programId => NeuroProgram) private _programs;

    NeuroFlashEmblem public immutable emblem;

    constructor(address admin) {
        require(admin != address(0), "NeuroFlashLedger: admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        emblem = new NeuroFlashEmblem();
        emblem.grantRole(emblem.DEFAULT_ADMIN_ROLE(), admin);
        emblem.grantRole(emblem.EMBLEM_MINTER_ROLE(), address(this));
    }

    function recordPulse(RecordPulseParams calldata params) external returns (uint256 pulseId) {
        require(params.payloadHash != bytes32(0), "NeuroFlashLedger: payload hash missing");
        require(params.rounds > 0, "NeuroFlashLedger: rounds missing");
        require(params.protocolMode > 0, "NeuroFlashLedger: mode missing");
        require(params.exposure <= uint8(ExposureLevel.Revealed), "NeuroFlashLedger: invalid exposure");
        if (params.exposure == uint8(ExposureLevel.Revealed)) {
            require(params.latencyMs > 0, "NeuroFlashLedger: latency missing");
        }

        euint64 sealedLatency = FHE.fromExternal(params.sealedLatencyInput, params.sealedProof);

        pulseId = ++_pulseCounter;
        PulseInternal storage stored = _pulses[pulseId];
        stored.pilot = msg.sender;
        stored.protocolMode = params.protocolMode;
        stored.artifactCID = params.artifactCID;
        stored.payloadHash = params.payloadHash;
        stored.exposure = params.exposure;
        stored.latencyMs = params.exposure == uint8(ExposureLevel.Revealed) ? params.latencyMs : 0;
        stored.programId = params.programId;
        stored.sealedLatency = sealedLatency;
        stored.submittedAt = uint64(block.timestamp);
        stored.deviceFingerprint = params.deviceFingerprint;
        stored.rounds = params.rounds;

        FHE.allow(stored.sealedLatency, address(this));
        FHE.allow(stored.sealedLatency, msg.sender);

        emit PulseRecorded(pulseId, msg.sender, params.payloadHash, params.exposure, params.programId, stored.submittedAt);
    }

    function viewPulse(uint256 pulseId) external view returns (PulseView memory rendered) {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");

        rendered = PulseView({
            pulseId: pulseId,
            pilot: stored.pilot,
            protocolMode: stored.protocolMode,
            artifactCID: stored.artifactCID,
            payloadHash: stored.payloadHash,
            exposure: stored.exposure,
            latencyMs: stored.latencyMs,
            programId: stored.programId,
            submittedAt: stored.submittedAt,
            deviceFingerprint: stored.deviceFingerprint,
            rounds: stored.rounds,
            validated: stored.validated,
            emblemTokenId: stored.emblemTokenId
        });
    }

    function sealedPulseValue(uint256 pulseId) external view returns (euint64) {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");
        return stored.sealedLatency;
    }

    function delegateDecrypt(uint256 pulseId, address to) external {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");
        require(stored.pilot == msg.sender || hasRole(CURATOR_ROLE, msg.sender), "NeuroFlashLedger: not authorized");
        FHE.allow(stored.sealedLatency, to);
        emit DecryptDelegated(pulseId, to);
    }

    function exposePulse(uint256 pulseId, uint64 latencyMs, string calldata clearCID) external {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");
        require(stored.pilot == msg.sender, "NeuroFlashLedger: not owner");
        require(latencyMs > 0, "NeuroFlashLedger: bad latency");

        stored.exposure = uint8(ExposureLevel.Revealed);
        stored.latencyMs = latencyMs;
        stored.artifactCID = clearCID;

        emit PulseExposed(pulseId, latencyMs, clearCID);
    }

    function pulseCount() external view returns (uint256) {
        return _pulseCounter;
    }

    function programCount() external view returns (uint256) {
        return _programCounter;
    }

    function emblemAddress() external view returns (address) {
        return address(emblem);
    }

    function scheduleProgram(
        string calldata manifestCID,
        uint64 windowStart,
        uint64 windowEnd,
        bytes32 rulesDigest
    ) external onlyRole(CURATOR_ROLE) returns (uint256 programId) {
        require(windowEnd == 0 || windowEnd > windowStart, "NeuroFlashLedger: invalid window");

        programId = ++_programCounter;
        _programs[programId] = NeuroProgram({
            programId: programId,
            curator: msg.sender,
            manifestCID: manifestCID,
            windowStart: windowStart,
            windowEnd: windowEnd,
            rulesDigest: rulesDigest
        });

        emit ProgramScheduled(programId, msg.sender, manifestCID);
    }

    function viewProgram(uint256 programId) external view returns (NeuroProgram memory) {
        NeuroProgram memory program = _programs[programId];
        require(program.curator != address(0), "NeuroFlashLedger: program not found");
        return program;
    }

    function auditPulse(uint256 pulseId, bool approved, string calldata verificationCID) external onlyRole(ANALYST_ROLE) {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");

        stored.validated = approved;
        emit PulseAudited(pulseId, msg.sender, approved, verificationCID);
    }

    function mintEmblemForPulse(uint256 pulseId, address to, string calldata emblemCID) external onlyRole(CURATOR_ROLE) returns (uint256 tokenId) {
        PulseInternal storage stored = _pulses[pulseId];
        require(stored.pilot != address(0), "NeuroFlashLedger: pulse not found");
        require(stored.emblemTokenId == 0, "NeuroFlashLedger: emblem exists");

        tokenId = emblem.mintEmblem(to, emblemCID);
        stored.emblemTokenId = tokenId;
        emit EmblemMinted(pulseId, tokenId, to);
    }
}

