package dev.skypea.mic_flowyx.infrastructure.security;

import dev.skypea.mic_flowyx.application.repositories.UserRepository;
import dev.skypea.mic_flowyx.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class GoogleJwtAuthenticationConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
        String googleId = jwt.getSubject();
        User user = userRepository.findById(googleId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + googleId));
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
        return new UsernamePasswordAuthenticationToken(googleId, null, authorities);
    }
}
