// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "../lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract DonationToken is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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
    error ZeroAddress();

    uint8 public constant USDC_DECIMALS = 6;
    IERC20 public usdc;

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

    modifier onlyCreator(uint256 _campaignId) {
        if (_campaignId >= campaigns.length) revert InvalidID();
        if (campaigns[_campaignId].creator != msg.sender) revert NotCreator();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 startDate, uint256 endDate);
    event Donated(uint256 indexed campaignId, address indexed donor, uint256 amountGross, uint256 amountNet, string donorName);
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount, string reason);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);
    event CampaignStatusChanged(uint256 indexed campaignId, bool isActive);
    event USDCAddressUpdated(address indexed oldAddress, address indexed newAddress);

    constructor(address _usdc) Ownable(msg.sender) Pausable() {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    function setUSDCAddress(address _usdc) external onlyOwner {
        if (_usdc == address(0)) revert ZeroAddress();
        address old = address(usdc);
        usdc = IERC20(_usdc);
        emit USDCAddressUpdated(old, _usdc);
    }

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

        campaigns.push(
            Campaign({
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
            })
        );

        emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal, _startDate, _endDate);
    }

    function donate(
        uint256 _campaignId,
        uint256 _amount,
        string memory _donorName
    ) external whenNotPaused validAmount(_amount) nonReentrant {
        if (_campaignId >= campaigns.length) revert InvalidID();
        Campaign storage camp = campaigns[_campaignId];

        if (!camp.active) revert CampaignInactive();
        if (block.timestamp < camp.startDate) revert NotStarted();
        if (block.timestamp > camp.endDate) revert CampaignEnded();

        // AUTO-CONVERT jika frontend kirim angka tanpa desimal (misal: 1, 5, 10)
        if (_amount < 1e6) {
            _amount = _amount * 1e6;
        }

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 fee = (_amount * PLATFORM_FEE_BPS) / 10000;
        uint256 netAmount = _amount - fee;
        totalPlatformFees += fee;

        camp.raised += netAmount;

        if (camp.raised >= camp.goal || block.timestamp > camp.endDate) {
            camp.isComplete = true;
        }

        if (donors[msg.sender].totalDonated == 0) {
            donorList.push(msg.sender);
            donors[msg.sender].name = _donorName;
        }
        donors[msg.sender].totalDonated += _amount;

        emit Donated(_campaignId, msg.sender, _amount, netAmount, _donorName);
    }

    function withdraw(uint256 _campaignId, uint256 _amount, string memory _reason)
        external
        onlyCreator(_campaignId)
        nonReentrant
        whenNotPaused 
    {
        Campaign storage c = campaigns[_campaignId];
        if (!c.isComplete) revert CampaignNotComplete();

        // AUTO-CONVERT jika frontend kirim angka tanpa desimal (misal: 1, 5, 10)
        if (_amount < 1e6) {
            _amount = _amount * 1e6;
        }

        uint256 maxWithdrawAllowed = (c.raised * 25) / 100;

        uint256 remaining = c.raised - c.withdrawnTotal;
        if (remaining < maxWithdrawAllowed) maxWithdrawAllowed = remaining;

        if (_amount > maxWithdrawAllowed) revert WithdrawLimitExceeded();

        c.withdrawnTotal += _amount;
        c.withdrawReason = _reason;

        usdc.safeTransfer(c.creator, _amount);

        emit Withdrawn(_campaignId, msg.sender, _amount, _reason);
    }

    function withdrawPlatformFees(address payable _to)
        external
        onlyOwner
        nonReentrant
    {
        uint256 amount = totalPlatformFees;
        if (amount == 0) revert NoFees();

        totalPlatformFees = 0;
        usdc.safeTransfer(_to, amount);

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

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function leaderBoard(uint256) external pure { revert("handled offchain"); }
    function getAllCampaigns() external pure { revert("handled offchain"); }
}