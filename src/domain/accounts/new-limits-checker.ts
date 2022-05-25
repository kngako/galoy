import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const AccountLimitsChecker = ({
  accountLimits,
  priceRatio,
}: {
  accountLimits: IAccountLimits
  priceRatio: PriceRatio
}): AccountLimitsChecker => {
  const checkIntraledger = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromNumber({
      amount: accountLimits.intraLedgerLimit,
      currency: WalletCurrency.Usd,
    })
    if (limit instanceof Error) return limit
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount.amount}`,
      "txVolume.limitCheck": "checkIntraledger",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new IntraledgerLimitsExceededError(
        `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`,
      )
    }
    return true
  }

  const checkWithdrawal = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromNumber({
      amount: accountLimits.withdrawalLimit,
      currency: WalletCurrency.Usd,
    })
    if (limit instanceof Error) return limit
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount.amount}`,
      "txVolume.limitCheck": "checkWithdrawal",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new WithdrawalLimitsExceededError(
        `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`,
      )
    }
    return true
  }

  return {
    checkIntraledger,
    checkWithdrawal,
  }
}

export const TwoFALimitsChecker = ({
  twoFALimits,
  priceRatio,
}: {
  twoFALimits: TwoFALimits
  priceRatio: PriceRatio
}): TwoFALimitsChecker => {
  const checkTwoFA = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromNumber({
      amount: twoFALimits.threshold,
      currency: WalletCurrency.Usd,
    })
    if (limit instanceof Error) return limit
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount.amount}`,
      "txVolume.limitCheck": "checkTwoFA",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new TwoFALimitsExceededError()
    }
    return true
  }

  return {
    checkTwoFA,
  }
}
