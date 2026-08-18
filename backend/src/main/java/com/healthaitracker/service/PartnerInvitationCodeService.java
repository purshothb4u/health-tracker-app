package com.healthaitracker.service;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Component
public class PartnerInvitationCodeService {

    private static final String ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    private static final int ENTROPY_BYTES = 10;
    private static final int NORMALIZED_CODE_LENGTH = 16;
    private static final int DISPLAY_GROUP_LENGTH = 4;

    private final SecureRandom secureRandom = new SecureRandom();

    public GeneratedInviteCode generate() {
        byte[] entropy = new byte[ENTROPY_BYTES];
        secureRandom.nextBytes(entropy);
        String normalizedCode = encodeBase32(entropy);
        return new GeneratedInviteCode(formatForDisplay(normalizedCode), hash(normalizedCode));
    }

    public Optional<String> hashSubmittedCode(String submittedCode) {
        return normalize(submittedCode).map(this::hash);
    }

    private Optional<String> normalize(String submittedCode) {
        if (submittedCode == null) {
            return Optional.empty();
        }
        String normalized = submittedCode
                .replace("-", "")
                .replaceAll("\\s", "")
                .toUpperCase(Locale.ROOT);
        if (normalized.length() != NORMALIZED_CODE_LENGTH) {
            return Optional.empty();
        }
        for (int index = 0; index < normalized.length(); index++) {
            if (ALPHABET.indexOf(normalized.charAt(index)) < 0) {
                return Optional.empty();
            }
        }
        return Optional.of(normalized);
    }

    private String encodeBase32(byte[] entropy) {
        StringBuilder encoded = new StringBuilder(NORMALIZED_CODE_LENGTH);
        int buffer = 0;
        int bufferedBits = 0;
        for (byte value : entropy) {
            buffer = (buffer << 8) | (value & 0xff);
            bufferedBits += 8;
            while (bufferedBits >= 5) {
                bufferedBits -= 5;
                encoded.append(ALPHABET.charAt((buffer >> bufferedBits) & 31));
            }
        }
        return encoded.toString();
    }

    private String formatForDisplay(String normalizedCode) {
        StringBuilder formatted = new StringBuilder(normalizedCode.length() + 3);
        for (int index = 0; index < normalizedCode.length(); index++) {
            if (index > 0 && index % DISPLAY_GROUP_LENGTH == 0) {
                formatted.append('-');
            }
            formatted.append(normalizedCode.charAt(index));
        }
        return formatted.toString();
    }

    private String hash(String normalizedCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(normalizedCode.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    public record GeneratedInviteCode(String rawCode, String hash) {
    }
}
