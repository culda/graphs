import { log } from '@graphprotocol/graph-ts'
import { Transfer } from '../types/BaseToken/baseToken'
import { BaseTransfer } from '../types/schema'
import { baseTokenContract } from '../utils/constants'
import { createUser } from '../utils/user'

export function handleTransfer(event: Transfer): void {
  let baseTransfer = new BaseTransfer(event.transaction.hash.toHex())
  let userFrom = createUser(event.params.from)
  let userTo = createUser(event.params.to)

  baseTransfer.transferredIn = userFrom.id
  baseTransfer.transferredOut = userTo.id
  baseTransfer.symbol = baseTokenContract.symbol()
  baseTransfer.amountTransferred = event.transaction.value
  baseTransfer.balanceFrom = baseTokenContract.balanceOf(event.params.from)
  baseTransfer.balanceTo = baseTokenContract.balanceOf(event.params.to)
  baseTransfer.timestamp = event.block.timestamp
  baseTransfer.block = event.block.number
  baseTransfer.save()

  userFrom.lastTransferTimestamp = event.block.timestamp
  userFrom.save()

  userTo.lastTransferTimestamp = event.block.timestamp
  userTo.save()

  // let id = wbtcContract
  //   .symbol()
  //   .concat("_")
  //   .concat(user.toHexString());
  // let userTokenData = UserTokenData.load(id);

  // if (id === null) {
  //   userTokenData = new UserTokenData(id);
  //   userTokenData.token = wbtcContract.symbol();
  //   userTokenData.user = user.toHexString();
  // }

  // userTokenData.balance = wbtcContract.balanceOf(user);
  // userTokenData.timestamp = event.block.timestamp;
  // userTokenData.block = event.block.number;
  // userTokenData.save();
}
