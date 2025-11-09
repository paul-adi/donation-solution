// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IPythOracle} from "./interfaces/IPythOracle.sol";
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
        uint256 withdrawAmount;
        uint256 withdrawnTotal;
    }

    struct Donor {
        string name;
        uint256 totalDonated;
    }

    Campaign[] public campaigns;
    mapping(address => Donor) public donors;
    address[] public donorList;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 startDate,
        uint256 endDate
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 fee,
        uint256 netAmount
    );

    event Withdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event PlatformFeesWithdrawn(
        address indexed to,
        uint256 amount
    );

    event CampaignStatusChanged(
        uint256 indexed campaignId,
        bool isActive
    );

    modifier onlyCreator(uint256 _campaignId) {
        if (_campaignId >= campaigns.length) revert InvalidID();
        if (campaigns[_campaignId].creator != msg.sender) revert NotCreator();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    constructor() Ownable(msg.sender) Pausable() {}

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
            withdrawAmount: 0,
            withdrawnTotal: 0
        });

        campaigns.push(newC);
        uint256 id = campaigns.length - 1;

        emit CampaignCreated(id, msg.sender, _title, _goal, _startDate, _endDate);
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function getAllDonors() external view returns (Donor[] memory) {
        uint256 length = donorList.length;
        Donor[] memory list = new Donor[](length);
        for (uint256 i = 0; i < length; i++) {
            list[i] = donors[donorList[i]];
        }
        return list;
    }

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
        camp.withdrawAmount = camp.raised;

        if (camp.raised >= camp.goal || block.timestamp > camp.endDate) {
            camp.isComplete = true;
        }

        if (donors[msg.sender].totalDonated == 0) {
            donorList.push(msg.sender);
            donors[msg.sender].name = _donorName;
            donors[msg.sender].totalDonated = _donatedAmount;
        } else {
            donors[msg.sender].totalDonated += _donatedAmount;
        }

        emit DonationReceived(_campaignId, msg.sender, _donatedAmount, fee, netAmount);
    }

    function withdraw(uint256 _campaignId, uint256 _amount)
        external
        onlyCreator(_campaignId)
        nonReentrant
    {
        Campaign storage c = campaigns[_campaignId];

        if (!c.isComplete) revert CampaignNotComplete();
        if (_amount == 0) revert InvalidAmount();

        uint256 maxWithdrawAllowed = (c.withdrawAmount * 25) / 100;
        if (c.withdrawnTotal + _amount > maxWithdrawAllowed) revert WithdrawLimitExceeded();

        c.withdrawnTotal += _amount;
        c.creator.transfer(_amount);

        emit Withdrawn(_campaignId, msg.sender, _amount);
    }

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
}
