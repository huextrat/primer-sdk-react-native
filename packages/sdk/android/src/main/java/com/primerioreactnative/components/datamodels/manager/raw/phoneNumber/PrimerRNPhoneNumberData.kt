package com.primerioreactnative.components.datamodels.manager.raw.phoneNumber

import io.primer.android.phoneNumber.PrimerPhoneNumberData
import kotlinx.serialization.Serializable

@Serializable
internal data class PrimerRNPhoneNumberData(
    val phoneNumber: String? = null,
) {
    fun toPrimerPhoneNumberData() =
        PrimerPhoneNumberData(
            phoneNumber.orEmpty(),
        )
}
