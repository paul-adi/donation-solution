// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "../lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Donation is Ownable, Pausable, ReentrancyGuard {
    // Custom errors
    error InvalidAmount();
    error InvalidID();
    error NotCreator();
    error CampaignInactive();
    error NotStarted();
    error CampaignEnded();
    error TitleRequired();
    error DescriptionRequired();
    error EmailRequired();
    error InvalidGoal(); 
    error InvalidDates();
    error StartDateTooEarly();
    error CampaignNotComplete();
    error WithdrawLimitExceeded();
    error NoFees();
    error TransferFailed();

    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public totalPlatformFees;

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
        bool isComplete;
        uint256 withdrawnTotal;
    }

    struct Donor {
        string name;
        uint256 totalDonated;
    }

    Campaign[] public campaigns;
    mapping(address => Donor) public donors;
    address[] public donorList;

    // Tracking donors per campaign
    mapping(uint256 => address[]) public campaignDonors;
    mapping(uint256 => mapping(address => bool)) private isDonorInCampaign;
    mapping(uint256 => mapping(address => uint256)) public donationsPerCampaign;

    // Modifiers
    modifier onlyCreator(uint256 _campaignId) {
        if (_campaignId >= campaigns.length) revert InvalidID();
        if (campaigns[_campaignId].creator != msg.sender) revert NotCreator();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    // Events
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 startDate, uint256 endDate);
    event Donated(uint256 indexed campaignId, address indexed donor, uint256 amount, string donorName);
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);
    event CampaignStatusChanged(uint256 indexed campaignId, bool isActive);

    constructor() Ownable(msg.sender) Pausable() {}

    // Create campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _email,
        uint256 _goal,
        string memory _image,
        uint256 _startDate,
        uint256 _endDate
    ) external whenNotPaused {
        if (bytes(_title).length == 0) revert TitleRequired();
        if (bytes(_description).length == 0) revert DescriptionRequired();
        if (bytes(_email).length == 0) revert EmailRequired();
        if (_goal == 0) revert InvalidGoal();
        if (_startDate >= _endDate) revert InvalidDates();
        if (_startDate < block.timestamp) revert StartDateTooEarly();

        Campaign memory newC = Campaign({
            active: true,
            creator: payable(msg.sender),
            title: _title,
            description: _description,
            email: _email,
            goal: _goal,
            raised: 0,
            image: _image,
            startDate: _startDate,
            endDate: _endDate,
            isComplete: false,
            withdrawnTotal: 0
        });

        campaigns.push(newC);
        emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal, _startDate, _endDate);
    }

    // Donate to a campaign
    function donate(
        uint256 _campaignId,
        string memory _donorName,
        uint256 _donatedAmount
    ) external payable whenNotPaused validAmount(_donatedAmount) {
        if (_campaignId >= campaigns.length) revert InvalidID();
        Campaign storage camp = campaigns[_campaignId];

        if (!camp.active) revert CampaignInactive();
        if (block.timestamp < camp.startDate) revert NotStarted();
        if (block.timestamp > camp.endDate) revert CampaignEnded();

        uint256 fee = (_donatedAmount * PLATFORM_FEE_BPS) / 10000;
        uint256 netAmount = _donatedAmount - fee;
        totalPlatformFees += fee;

        camp.raised += netAmount;

        if (camp.raised >= camp.goal || block.timestamp > camp.endDate) {
            camp.isComplete = true;
        }

        // Update global donor data
        if (donors[msg.sender].totalDonated == 0) {
            donorList.push(msg.sender);
            donors[msg.sender].name = _donorName;
        }
        donors[msg.sender].totalDonated += _donatedAmount;

        // Update campaign-specific donor data
        if (!isDonorInCampaign[_campaignId][msg.sender]) {
            campaignDonors[_campaignId].push(msg.sender);
            isDonorInCampaign[_campaignId][msg.sender] = true;
        }
        donationsPerCampaign[_campaignId][msg.sender] += _donatedAmount;

        emit Donated(_campaignId, msg.sender, _donatedAmount, _donorName);
    }

    // Withdraw 25% of raised amount
    function withdraw(uint256 _campaignId, uint256 _amount)
        external
        onlyCreator(_campaignId)
        nonReentrant
    {
        Campaign storage c = campaigns[_campaignId];

        if (!c.isComplete) revert CampaignNotComplete();
        if (_amount == 0) revert InvalidAmount();

        uint256 maxWithdrawAllowed = (c.raised * 25) / 100;
        if (c.withdrawnTotal + _amount > maxWithdrawAllowed) revert WithdrawLimitExceeded();

        c.withdrawnTotal += _amount;
        c.creator.transfer(_amount);

        emit Withdrawn(_campaignId, msg.sender, _amount);
    }

    // Withdraw platform fees
    function withdrawPlatformFees(address payable _to)
        external
        onlyOwner
        nonReentrant
    {
        uint256 amount = totalPlatformFees;
        if (amount == 0) revert NoFees();

        totalPlatformFees = 0;
        (bool ok, ) = _to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit PlatformFeesWithdrawn(_to, amount);
    }

    // Change campaign status
    function setCampaignStatus(uint256 _campaignId, bool isActive)
        external
        onlyOwner
    {
        if (_campaignId >= campaigns.length) revert InvalidID();
        campaigns[_campaignId].active = isActive;
        emit CampaignStatusChanged(_campaignId, isActive);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Get all campaigns (full data)
    function getAllCampaigns() external view returns (
        uint256[] memory ids,
        bool[] memory actives,
        address[] memory creators,
        string[] memory titles,
        string[] memory descriptions,
        string[] memory emails,
        uint256[] memory goals,
        uint256[] memory raiseds,
        string[] memory images,
        uint256[] memory startDates,
        uint256[] memory endDates,
        bool[] memory isCompletes,
        uint256[] memory withdrawnTotals
    ) {
        uint256 length = campaigns.length;

        ids = new uint256[](length);
        actives = new bool[](length);
        creators = new address[](length);
        titles = new string[](length);
        descriptions = new string[](length);
        emails = new string[](length);
        goals = new uint256[](length);
        raiseds = new uint256[](length);
        images = new string[](length);
        startDates = new uint256[](length);
        endDates = new uint256[](length);
        isCompletes = new bool[](length);
        withdrawnTotals = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            Campaign storage c = campaigns[i];
            ids[i] = i;
            actives[i] = c.active;
            creators[i] = c.creator;
            titles[i] = c.title;
            descriptions[i] = c.description;
            emails[i] = c.email;
            goals[i] = c.goal;
            raiseds[i] = c.raised;
            images[i] = c.image;
            startDates[i] = c.startDate;
            endDates[i] = c.endDate;
            isCompletes[i] = c.isComplete;
            withdrawnTotals[i] = c.withdrawnTotal;
        }
    }

    // Get donors per campaign
    function getDonorsByCampaign(uint256 _campaignId) external view returns (
        address[] memory donorAddresses,
        string[] memory donorNames,
        uint256[] memory totalDonations
    ) {
        if (_campaignId >= campaigns.length) revert InvalidID();
        address[] storage list = campaignDonors[_campaignId];
        uint256 length = list.length;

        donorAddresses = new address[](length);
        donorNames = new string[](length);
        totalDonations = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address donorAddr = list[i];
            Donor storage d = donors[donorAddr];
            donorAddresses[i] = donorAddr;
            donorNames[i] = d.name;
            totalDonations[i] = donationsPerCampaign[_campaignId][donorAddr];
        }
    }
}
