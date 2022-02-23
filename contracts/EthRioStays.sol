// SPDX-License-Identifier: GPL
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract EthRioStays is ERC721URIStorage {

  constructor() ERC721("EthRioStays", "ERS22") {}

  struct LodgingFacility{
    address owner;
    string dataURI;
    bool exists;
  }

  struct Space {
    uint64 quantity;
    uint64 pricePerNightWei;
    bool active;
    string dataURI;
  }

  mapping (address => bytes32[]) private _facilitiesByOwner;

  bytes32[] private _lodgingFacilityIds;
  mapping (bytes32 => LodgingFacility) public lodgingFacilities;

  using Counters for Counters.Counter;
  Counters.Counter private _spaceIds;
  mapping (bytes32 => Space[]) private _spaces;

  function registerLodgingFacility(string calldata _dataURI) public {
    require(bytes(_dataURI).length > 0, "Data URI must be provided");

    bytes32 _id = keccak256(abi.encodePacked(
      _msgSender(),
      _dataURI
    ));
    
    require(!lodgingFacilities[_id].exists, "Facility already exists");

    lodgingFacilities[_id] = LodgingFacility(_msgSender(), _dataURI, true);
    _lodgingFacilityIds.push(_id);

    _facilitiesByOwner[_msgSender()].push(_id);

    emit LodgingFacilityCreated(_id, _msgSender(), _dataURI);
  }

  function getAllLodgingFacilityIds() public view returns (bytes32[] memory) {
    return _lodgingFacilityIds;
  } 

  function getMyLodgingFacilityIds() public view returns (bytes32[] memory) {
    return _facilitiesByOwner[_msgSender()];
  }

  function updateLodgingFacility(uint256 _lodgingFacilityId, string calldata _dataURI) public {
    // TODO: owner should be able to update dataUri
  }

  function removeLodgingFacility(uint256 _lodgingFacilityId) public {
    // TODO: owner should be able to remove/deactivate their facility
  }

  function addSpace(bytes32 _lodgingFacilityId, uint64 _quantity, uint64 _pricePerNightWei, bool _active, string calldata _dataURI) public {
    bytes32 _i = _lodgingFacilityId;
    require(lodgingFacilities[_i].exists, "Facility does not exist");
    require(lodgingFacilities[_i].owner == _msgSender(), "Only facility owner may add Spaces");
    require(bytes(_dataURI).length > 0, "Data URI must be provided");

    _spaces[_i].push(Space(_quantity, _pricePerNightWei, _active, _dataURI));
    emit SpaceAdded(_i, _quantity, _pricePerNightWei, _active, _dataURI);
  }

  function getSpacesByFacilityId(bytes32 _lodgingFacilityId) public view returns (Space[] memory) {
    return _spaces[_lodgingFacilityId];
  }

  event LodgingFacilityCreated(bytes32 facilityID, address indexed owner, string dataURI);
  event SpaceAdded(bytes32 facilityID, uint64 quantity, uint64 pricePerNightWei, bool active, string dataURI);
}
