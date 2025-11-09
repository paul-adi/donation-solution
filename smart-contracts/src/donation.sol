// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract Donation {
    // state variables
    address public admin;
    uint256 public totalDonations;

    Campaign[] public campaigns;
    Donor[] public donors;

    struct Campaign {
        bool active;
        address payable creator;
        string title;
        string description;
        string email;
        uint256 goal;
        uint256 raised;
        string image;
        uint256 startDate;
        uint256 endDate;
    }

    struct Donor {
        string name;
        uint256 totalDonated;
    }

    // modifier
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin!");
        _;
    }

    modifier onlyCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not creator!");
        _;
    }

    // constructor
    constructor() {
        admin = msg.sender;
    }

    // functions
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _email,
        uint256 goal,
        string memory image,
        uint256 startDate,
        uint256 endDate
    ) external {
        // TODO
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function getAllDonors() external view returns (Donor[] memory) {
        return donors;
    }

    function donate(
        uint256 campaignId, // campaign id = index of arraay campaigns
        string memory _donorName,
        uint256 _donatedAmount
    ) external payable {
        // TODO
    }

    function withdraw(
        uint256 _campaignId,
        uint256 amount
    ) external onlyCreator(_campaignId) {
        // TODO
    }
}
