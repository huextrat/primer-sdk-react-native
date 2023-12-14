package com.primerioreactnative.components.events

internal enum class PrimerHeadlessUniversalCheckoutRedirectManagerEvent(val eventName: String) {
  ON_RETRIEVING("onRetrieving"),
  ON_RETRIEVED("onRetrieved"),
  ON_IN_VALID("onInvalid"),
  ON_VALID("onValid"),
  ON_VALIDATING("onValidating"),
  ON_ERROR("onError"),
}
