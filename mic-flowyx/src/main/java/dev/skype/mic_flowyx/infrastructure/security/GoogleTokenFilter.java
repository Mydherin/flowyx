package dev.skype.mic_flowyx.infrastructure.security;

import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class GoogleTokenFilter extends OncePerRequestFilter {

    private final RestClient googleRestClient;
    private final String googleClientId;
    private final UserRepository userRepository;

    public GoogleTokenFilter(
            @Qualifier("googleRestClient") RestClient googleRestClient,
            @Value("${google.oauth2.client-id}") String googleClientId,
            UserRepository userRepository) {
        this.googleRestClient = googleRestClient;
        this.googleClientId = googleClientId;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractBearerToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            GoogleTokenInfo info = googleRestClient.get()
                    .uri("/oauth2/v3/tokeninfo?access_token={token}", token)
                    .retrieve()
                    .body(GoogleTokenInfo.class);

            if (info == null || !googleClientId.equals(info.aud())) {
                sendUnauthorized(response, "Invalid token audience");
                return;
            }

            if (!"true".equalsIgnoreCase(info.emailVerified())) {
                sendUnauthorized(response, "Email not verified");
                return;
            }

            String roleName = userRepository.findByEmail(info.email())
                    .map(user -> "ROLE_" + user.role().name())
                    .orElse("ROLE_USER");

            var auth = new UsernamePasswordAuthenticationToken(
                    info.email(),
                    null,
                    List.of(new SimpleGrantedAuthority(roleName))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);

        } catch (HttpClientErrorException ex) {
            sendUnauthorized(response, "Token validation failed");
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
