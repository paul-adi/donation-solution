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
        string withdrawReason;
    }

    struct Donor {
        string name;
        uint256 totalDonated;
    }

    Campaign[] public campaigns;
    mapping(address => Donor) public donors;
    address[] public donorList;

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
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount, string reason);
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
            withdrawnTotal: 0,
            withdrawReason: ""
        });

        campaigns.push(newC);
        emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal, _startDate, _endDate);
    }

    // Donate to a campaign
    function donate(
        uint256 _campaignId,
        string memory _donorName
    ) external payable whenNotPaused {
        uint256 _donatedAmount = msg.value;
        if (_donatedAmount == 0) revert InvalidAmount();
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

        if (donors[msg.sender].totalDonated == 0) {
            donorList.push(msg.sender);
            donors[msg.sender].name = _donorName;
        }
        donors[msg.sender].totalDonated += _donatedAmount;

        emit Donated(_campaignId, msg.sender, _donatedAmount, _donorName);
    }

    // Withdraw 25% of raised amount
    function withdraw(uint256 _campaignId, uint256 _amount, string memory _reason)
    external
    onlyCreator(_campaignId)
    nonReentrant
    {
        Campaign storage c = campaigns[_campaignId];

        if (!c.isComplete) revert CampaignNotComplete();
        if (_amount == 0) revert InvalidAmount();

        uint256 maxWithdrawAllowed = (c.raised * 25) / 100;
        uint256 remaining = c.raised - c.withdrawnTotal;
        if (remaining <= maxWithdrawAllowed) maxWithdrawAllowed = remaining;
        if (_amount > maxWithdrawAllowed) revert WithdrawLimitExceeded();

        // Effects
        c.withdrawnTotal += _amount;
        c.withdrawReason = _reason;

        // Interaction using call (more compatible than transfer)
        (bool ok, ) = c.creator.call{value: _amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(_campaignId, msg.sender, _amount, _reason);
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

    // Fitur LeaderBoard
    function leaderBoard(uint256 /* topN */)
        external
        pure
    {
        revert("leaderBoard is handled offchain via events");
    }

    // Get all campaigns
    function getAllCampaigns()
        external
        pure
    {
        revert("getAllCampaigns is handled offchain via events");
    }
}