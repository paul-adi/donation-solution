.PHONY: build test deploy clean verify

# Build contracts
build:
	forge build

# Run tests
test:
	forge test

# Deploy to Sepolia testnet
deploy-sepolia:
	forge script script/Deploy.s.sol --rpc-url $(RPC_URL) --private-key $(DEPLOYER_PRIVATE_KEY) --broadcast --verify --slow

# Deploy to mainnet (be careful!)
deploy-mainnet:
	forge script script/Deploy.s.sol --rpc-url $(MAINNET_RPC_URL) --private-key $(DEPLOYER_PRIVATE_KEY) --broadcast --verify --slow

# Clean build artifacts
clean:
	forge clean

# Install dependencies
install:
	forge install

# Format code
format:
	forge fmt

# Run gas snapshot
snapshot:
	forge snapshot

# Verify contract on blockchain explorer
# Usage: make verify CONTRACT_ADDRESS=<address> CONTRACT_PATH=<path> CHAIN=<chain>
verify:
	forge verify-contract --chain $(CHAIN) --etherscan-api-key $(ETHERSCAN_API_KEY) $(CONTRACT_ADDRESS) $(CONTRACT_PATH)

# Load environment variables
include .env
export