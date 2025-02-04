import { Prices } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Currency from "@graphql/types/object/currency"

const CurrencyListQuery = GT.Field({
  type: GT.List(Currency),
  resolve: async () => {
    const currencies = await Prices.listCurrencies()
    if (currencies instanceof Error) throw mapError(currencies)

    return currencies
  },
})

export default CurrencyListQuery
