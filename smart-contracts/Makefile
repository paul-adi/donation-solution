.PHONY: build test deploy clean

# Build contracts
build:
	forge build

# Run tests
test:
	forge test

# Deploy to Sepolia testnet
deploy-sepolia:
	forge script script/Deploy.s.sol --rpc-url $(RPC_URL) --private-key $(DEPLOYER_PRIVATE_KEY) --broadcast --verify

# Deploy to mainnet (be careful!)
deploy-mainnet:
	forge script script/Deploy.s.sol --rpc-url $(MAINNET_RPC_URL) --private-key $(DEPLOYER_PRIVATE_KEY) --broadcast --verify

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

# Load environment variables
include .env
export