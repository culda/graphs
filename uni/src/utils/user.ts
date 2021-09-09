import { Address } from '@graphprotocol/graph-ts'
import { User } from '../types/schema'
import { ZERO_BD, ZERO_BI } from './constants'

export function userExists(address: Address): User {
  return User.load(address.toHexString()) as User
}

export function createUser(address: Address): User {
  let user = User.load(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
    user.usdSwapped = ZERO_BD
    user.lastTransferTimestamp = ZERO_BI
    user.save()
  }
  return user as User
}
