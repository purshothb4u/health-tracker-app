package com.healthaitracker.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PartnerInvitationCodeServiceTest {

    private final PartnerInvitationCodeService codeService = new PartnerInvitationCodeService();

    @Test
    void generatesEightyBitHumanFriendlyCodesAndHashesNormalizedInput() {
        Set<String> generatedCodes = new HashSet<>();

        for (int index = 0; index < 256; index++) {
            PartnerInvitationCodeService.GeneratedInviteCode generated = codeService.generate();
            String normalized = generated.rawCode().replace("-", "");

            assertTrue(generated.rawCode().matches(
                    "[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{4}(?:-[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{4}){3}"));
            assertEquals(16, normalized.length());
            assertEquals(64, generated.hash().length());
            assertFalse(generated.hash().contains(normalized));
            assertEquals(
                    generated.hash(),
                    codeService.hashSubmittedCode(
                            generated.rawCode().toLowerCase().replace("-", " - "))
                            .orElseThrow());
            assertTrue(generatedCodes.add(generated.rawCode()));
        }
    }

    @Test
    void rejectsMalformedCodesWithoutHashingThem() {
        assertTrue(codeService.hashSubmittedCode(null).isEmpty());
        assertTrue(codeService.hashSubmittedCode("").isEmpty());
        assertTrue(codeService.hashSubmittedCode("IIII-OOOO-LLLL-UUUU").isEmpty());
        assertTrue(codeService.hashSubmittedCode("1234-5678-9ABC").isEmpty());
    }
}
