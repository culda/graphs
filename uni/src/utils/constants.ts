/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../types/templates/Pool/Factory'

import { baseToken as BaseContract } from '../types/BaseToken/baseToken'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const BASE_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
export let baseTokenContract = BaseContract.bind(Address.fromString(BASE_ADDRESS))

export const INCLUDED_PAIRS: string[] = [
  '0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801', //UNI_WETH
  '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', //USDC_WETH  
  //'0x60594a405d53811d3bc4766596efd80fd545a270' //DAI_WETH

  // need to retrieve the correct IDs
  // '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852', //USDT_WETH @ 10093341
  // '0xbb2b8038a1640196fbe3e38816f3e67cba72d940' //WBTC_WETH @ 10091097
]
