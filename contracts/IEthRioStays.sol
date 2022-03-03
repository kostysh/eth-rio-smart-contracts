// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.7;

abstract contract IEthRioStays {

  function registerLodgingFacility(string calldata _dataURI, bool _active) public virtual;

  // To display all availability in Glider:
  // 1
  function getAllLodgingFacilityIds() public virtual returns (bytes32[] memory);
  // 2
  function getSpaceIdsByFacilityId(bytes32 _lodgingFacilityId) public virtual returns (bytes32[] memory);
  // 3
  function getAvailability(bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays) public view virtual returns (uint16[] memory);

  // For the lodging facility owner, to display their facilites
  function getMyLodgingFacilityIds() public virtual returns (bytes32[] memory);

  // Facility management
  function updateLodgingFacility(uint256 _lodgingFacilityId, string calldata _newDataURI) public virtual;
  function deactivateLodgingFacility(uint256 _lodgingFacilityId) public virtual;
  function yieldLodgingFacility(uint256 _lodgingFacilityId, address _newOwner) public virtual;
  function deleteLodgingFacility(uint256 _lodgingFacilityId) public virtual;
  function addDelegate(uint256 _lodgingFacilityId, address _delegate, uint8 _accessLevel) public virtual;
  function changeAccessLevel(uint256 _lodgingFacilityId, address _delegate, uint8 _accessLevel) public virtual;
  function removeDelegate(uint256 _lodgingFacilityId, address _delegate) public virtual;

  // Stays
  function newStay(bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays, uint16 _quantity, string memory _tokenURI) public payable virtual returns (uint256);
  // getting all my Stays is via built-in NFT contract getter
  // geting Stay details is via NFT's tokenURI getter
  function getAllStayIdsByFacilityId(uint256 _lodgingFacilityId) public virtual returns (uint256[] memory);
  function getCurrentStayIdsByFacilityId(uint256 _lodgingFacilityId) public virtual returns (uint256[] memory);
  function getFutureStayIdsByFacilityId(uint256 _lodgingFacilityId) public virtual returns (uint256[] memory);
  function checkIn(uint256 _tokenId) public virtual;
  function checkOut(uint256 _tokenId) public virtual;
  function requestChange(uint256 _tokenId, bytes32 _spaceId, uint16 _startDay, uint16 _numberOfDays, uint16 _quantity) public payable virtual;
  function requestCancel(int256 _tokenId) public virtual;
  function requestResponse(uint256 _tokenId, bool _answer) public virtual;
}