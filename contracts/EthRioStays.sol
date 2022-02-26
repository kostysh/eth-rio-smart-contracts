// SPDX-License-Identifier: GPL
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract EthRioStays is ERC721URIStorage {

  constructor() ERC721("EthRioStays", "ERS22") {}

  uint32 public constant dayZero = 1645567342; // 22 Feb 2022
  address ukraineDAO = 0x633b7218644b83D57d90e7299039ebAb19698e9C; // ukrainedao.eth https://twitter.com/Ukraine_DAO/status/1497274679823941632
  // TODO percentage to go to Ukraine DAO
  // TODO: schema conformance URLs

  struct LodgingFacility{
    address owner;
    bool active;
    bool exists;
    string dataURI;
  }

  struct Space {
    bytes32 lodgingFacilityId;
    uint16 capacity;
    uint256 pricePerNightWei;
    bool active;
    bool exists;
    string dataURI;
  }

  bytes32[] private _lodgingFacilityIds;
  mapping (address => bytes32[]) private _facilityIdsByOwner;
  mapping (bytes32 => LodgingFacility) public lodgingFacilities;

  mapping (bytes32 => bytes32[]) private _spaceIdsByFacilityId;
  mapping (bytes32 => Space) public spaces;

  /*
   * Lodging Facilities
   */
  function registerLodgingFacility(string calldata _dataURI, bool _active) public {
    _dataUriMustBeProvided(_dataURI);

    bytes32 _id = keccak256(abi.encodePacked(
      _msgSender(),
      _dataURI
    ));

    require(!lodgingFacilities[_id].exists, "Facility already exists");

    lodgingFacilities[_id] = LodgingFacility(_msgSender(), _active, true, _dataURI);
    _lodgingFacilityIds.push(_id);

    _facilityIdsByOwner[_msgSender()].push(_id);

    emit LodgingFacilityCreated(_id, _msgSender(), _dataURI);
  }

  function getAllLodgingFacilityIds() public view returns (bytes32[] memory) {
    return _lodgingFacilityIds;
  }

  function getMyLodgingFacilityIds() public view returns (bytes32[] memory) {
    return _facilityIdsByOwner[_msgSender()];
  }

  function updateLodgingFacility(uint256 _lodgingFacilityId, string calldata _newDataURI) public {
    // TODO: owner should be able...
  }

  function deactivateLodgingFacility(uint256 _lodgingFacilityId) public {
    // TODO: owner should be able to deactivate their facility
  }

  function yieldLodgingFacility(uint256 _lodgingFacilityId, address _newOwner) public {
    // TODO: owner should be able to change facility owner
  }

  function deleteLodgingFacility(uint256 _lodgingFacilityId) public {
    // TODO: owner should be able to delete their facility
  }

  /*
   * Spaces
   */
  function addSpace(bytes32 _lodgingFacilityId, uint16 _capacity, uint64 _pricePerNightWei, bool _active, string calldata _dataURI) public {
    bytes32 _i = _lodgingFacilityId;

    _facilityShouldExist(_i);
    _shouldOnlyBeCalledByOwner(_i, "Only facility owner may add Spaces");
    _dataUriMustBeProvided(_dataURI);

    bytes32 _id = keccak256(abi.encodePacked(
      _i,
      _dataURI
    ));

    require(!spaces[_id].exists, "Space already exists");

    spaces[_id] = Space(
      _i,
      _capacity,
      _pricePerNightWei,
      _active,
      true,
      _dataURI
    );
    _spaceIdsByFacilityId[_i].push(_id);

    emit SpaceAdded(_i, _capacity, _pricePerNightWei, _active, _dataURI);
  }

  function updateSpace(uint256 _spaceIndex, uint16 _capacity, uint64 _pricePerNightWei, bool _active, string calldata _dataURI) public {
    // TODO
  }

  function getSpaceIdsByFacilityId(bytes32 _lodgingFacilityId) public view returns (bytes32[] memory) {
    return _spaceIdsByFacilityId[_lodgingFacilityId];
  }

  /*
   * Availability
   */
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  // _spaceId -> _daysFromDayZero -> _numberOfBookings
  mapping(bytes32 => mapping(uint16 => uint16)) private _booked;

  function getAvailability(bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays) public view returns (uint16[] memory) {
    _checkBookingParams(_spaceId, _startDay, _numberOfDays);

    Space memory _s = spaces[_spaceId];

    uint16[] memory _availability = new uint16[](_numberOfDays);

    for (uint16 _x = 0; _x < _numberOfDays; _x++) {
      _availability[_x] = _s.capacity - _booked[_spaceId][_startDay+_x];
    }

    return _availability;
  }

  using Counters for Counters.Counter;
  Counters.Counter private _stayTokenIds;

  function bookAStay(bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays, uint16 _quantity, string memory _tokenURI) public payable returns (uint256) {
    _checkBookingParams(_spaceId, _startDay, _numberOfDays);

    Space memory _s = spaces[_spaceId];

    require(msg.value >= _numberOfDays * _quantity * _s.pricePerNightWei, "Need. More. Money!");

    for (uint16 _x = 0; _x < _numberOfDays; _x++) {
      require(_s.capacity - _booked[_spaceId][_startDay+_x] >= _quantity, "Insufficient inventory");
      _booked[_spaceId][_startDay+_x] += _quantity;
    }

    _stayTokenIds.increment();
    uint256 _newStayTokenId = _stayTokenIds.current();
    _safeMint(_msgSender(), _newStayTokenId);
    _setTokenURI(_newStayTokenId, _tokenURI);

    // TODO: divert all the excess WEI to Ukraine DAO
    // TODO: Receive Ukraine Supporter NFT

    emit StayBooked(_spaceId, _newStayTokenId);

    return _newStayTokenId;
  }

  /*
   * Helpers
   */
  function _facilityShouldExist(bytes32 _i) internal view {
    require(lodgingFacilities[_i].exists, "Facility does not exist");
  }

  function _spaceShouldExist(bytes32 _i) internal view {
    require(spaces[_i].exists, "Space does not exist");
  }

  function _shouldOnlyBeCalledByOwner(bytes32 _i, string memory _message) internal view {
    require(lodgingFacilities[_i].owner == _msgSender(), _message);
  }

  function _dataUriMustBeProvided(string memory _uri) internal pure {
    require(bytes(_uri).length > 0, "Data URI must be provided");
  }

  function _checkBookingParams(bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays) internal view {
    require(dayZero + _startDay * 86400 > block.timestamp - 86400 * 2, "Don't stay in the past");
    require(lodgingFacilities[spaces[_spaceId].lodgingFacilityId].active, "Lodging Facility is inactive");
    require(spaces[_spaceId].active, "Space is inactive");
    require(_numberOfDays > 0, "Number of days should be 1 or more");
  }

  /*
   * Events
   */
  event LodgingFacilityCreated(bytes32 facilityID, address indexed owner, string dataURI);
  event SpaceAdded(bytes32 facilityID, uint64 capacity, uint64 pricePerNightWei, bool active, string dataURI);
  event SpaceUpdated(bytes32 facilityID, uint256 index, uint64 capacity, uint64 pricePerNightWei, bool active, string dataURI);
  event StayBooked(bytes32 spaceID, uint256 tokenId);
}
