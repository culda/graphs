/* eslint-disable prefer-const */
import { log, BigInt, BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../types/Factory/ERC20";
import { ERC20SymbolBytes } from "../types/Factory/ERC20SymbolBytes";
import { ERC20NameBytes } from "../types/Factory/ERC20NameBytes";
import { baseToken as BaseContract, baseToken } from "../types/BaseToken/baseToken";
import {
  User,
  Bundle,
  Token,
  LiquidityPosition,
  LiquidityPositionSnapshot,
  Pair,
  UserTokenData,
  UserSpotPosition,
} from "../types/schema";
import { Factory as FactoryContract } from "../types/templates/Pair/Factory";
import { TokenDefinition } from "./tokenDefinition";

export const INCLUDED_PAIRS: string[] = [
  "0x004375dff511095cc5a197a54140a24efef3a416", //WBTC_USDC @ 10092348
  "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", //USDC_WETH @ 10008355
  "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", //DAI_WETH @ 10042267
  "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", //USDT_WETH @ 10093341
  "0xbb2b8038a1640196fbe3e38816f3e67cba72d940", //WBTC_WETH @ 10091097
];

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const BASE_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"; // WBTC @ 6766284

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export let baseTokenContract = BaseContract.bind(Address.fromString(BASE_ADDRESS));
export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS));

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ["0x9ea3b5b4ec044b70375236a281986106457b20ef"];

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString("1000000000000000000");
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(18));
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString());
  const zero = parseFloat(ZERO_BD.toString());
  if (zero == formattedVal) {
    return true;
  }
  return false;
}

export function isNullEthValue(value: string): boolean {
  return value == "0x0000000000000000000000000000000000000000000000000000000000000001";
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).symbol;
  }

  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).name;
  }

  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);
  let totalSupplyValue = null;
  let totalSupplyResult = contract.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult as i32;
  }
  return BigInt.fromI32(totalSupplyValue as i32);
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).decimals;
  }

  let contract = ERC20.bind(tokenAddress);
  // try types uint8 for decimals
  let decimalValue = null;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }
  return BigInt.fromI32(decimalValue as i32);
}

export function createLiquidityPosition(exchange: Address, user: Address): LiquidityPosition {
  let id = exchange
    .toHexString()
    .concat("-")
    .concat(user.toHexString());
  let liquidityTokenBalance = LiquidityPosition.load(id);
  if (liquidityTokenBalance === null) {
    let pair = Pair.load(exchange.toHexString());
    log.debug("exchange=", [exchange.toHexString()]);
    pair.liquidityProviderCount = pair.liquidityProviderCount.plus(ONE_BI);
    liquidityTokenBalance = new LiquidityPosition(id);
    liquidityTokenBalance.liquidityTokenBalance = ZERO_BD;
    liquidityTokenBalance.pair = exchange.toHexString();
    liquidityTokenBalance.user = user.toHexString();
    liquidityTokenBalance.save();
    pair.save();
  }
  if (liquidityTokenBalance === null) log.error("LiquidityTokenBalance is null", [id]);
  return liquidityTokenBalance as LiquidityPosition;
}

export function createUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user === null) {
    user = new User(address.toHexString());
    user.usdSwapped = ZERO_BD;
    user.lastTransferTimestamp = ZERO_BI;
    user.save();
  }
  return user as User;
}

export function createLiquiditySnapshot(position: LiquidityPosition, event: ethereum.Event): void {
  let timestamp = event.block.timestamp.toI32();
  let bundle = Bundle.load("1");
  let pair = Pair.load(position.pair);
  let token0 = Token.load(pair.token0);
  let token1 = Token.load(pair.token1);

  // create new snapshot
  let snapshot = new LiquidityPositionSnapshot(position.id.concat(timestamp.toString()));
  snapshot.liquidityPosition = position.id;
  snapshot.timestamp = timestamp;
  snapshot.block = event.block.number.toI32();
  snapshot.user = position.user;
  snapshot.pair = position.pair;
  snapshot.token0PriceUSD = token0.derivedETH.times(bundle.ethPrice);
  snapshot.token1PriceUSD = token1.derivedETH.times(bundle.ethPrice);
  snapshot.reserve0 = pair.reserve0;
  snapshot.reserve1 = pair.reserve1;
  snapshot.reserveUSD = pair.reserveUSD;
  snapshot.liquidityTokenTotalSupply = pair.totalSupply;
  snapshot.liquidityTokenBalance = position.liquidityTokenBalance;
  snapshot.liquidityPosition = position.id;
  snapshot.save();
  position.save();
}

export function getTokenBalance(tokenAddress: Address, user: Address): BigInt {
  log.debug("token {}", [tokenAddress.toHexString()]);
  if (tokenAddress == Address.fromString(BASE_ADDRESS)) {
    return baseTokenContract.balanceOf(user);
  }
  return null;
}

// export function createSpotPosition(token: Address, user: Address): SpotSpotPosition {
//   let id = token
//     .toHexString()
//     .concat("-")
//     .concat(user.toHexString());
//   let liquidityTokenBalance = LiquidityPosition.load(id);
//   if (liquidityTokenBalance === null) {
//     let pair = Pair.load(exchange.toHexString());
//     log.debug("exchange=", [exchange.toHexString()]);
//     pair.liquidityProviderCount = pair.liquidityProviderCount.plus(ONE_BI);
//     liquidityTokenBalance = new LiquidityPosition(id);
//     liquidityTokenBalance.liquidityTokenBalance = ZERO_BD;
//     liquidityTokenBalance.pair = exchange.toHexString();
//     liquidityTokenBalance.user = user.toHexString();
//     liquidityTokenBalance.save();
//     pair.save();
//   }
//   if (liquidityTokenBalance === null) log.error("LiquidityTokenBalance is null", [id]);
//   return liquidityTokenBalance as LiquidityPosition;
// }
