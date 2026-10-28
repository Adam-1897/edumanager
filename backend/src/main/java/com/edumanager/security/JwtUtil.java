package com.edumanager.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    private final Key key;
    @Value("${jwt.expiration}") private long expiration;

    public JwtUtil(@Value("${jwt.secret:}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            // No (or too short) secret configured: use a random key so nobody can forge tokens with a known value.
            // Logins then stop being valid after a restart; set JWT_SECRET to keep them.
            System.out.println("⚠ jwt.secret not set (or under 32 bytes) — using a random signing key for this run");
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }

    private Key getKey() { return key; }

    public String generateToken(String username, String role) {
        return Jwts.builder().setSubject(username).claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getKey(), SignatureAlgorithm.HS256).compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(getKey()).build()
            .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token, UserDetails user) {
        try {
            String username = extractUsername(token);
            Date expiry = Jwts.parserBuilder().setSigningKey(getKey()).build()
                .parseClaimsJws(token).getBody().getExpiration();
            return username.equals(user.getUsername()) && expiry.after(new Date());
        } catch (Exception e) { return false; }
    }
}
