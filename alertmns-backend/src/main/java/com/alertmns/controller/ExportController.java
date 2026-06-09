package com.alertmns.controller;

import com.alertmns.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Contrôleur REST pour l'export des messages d'un canal.
 *
 * GET /api/export/{channelId}/json — export JSON (application/json)
 * GET /api/export/{channelId}/csv  — export CSV  (text/csv)
 * GET /api/export/{channelId}/xml  — export XML  (application/xml)
 *
 * Chaque réponse inclut un header Content-Disposition: attachment
 * pour déclencher le téléchargement côté navigateur/client.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/{channelId}/json")
    public ResponseEntity<byte[]> exportJson(@PathVariable UUID channelId) {
        byte[] data = exportService.exportJson(channelId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        attachment("messages-" + channelId + ".json"))
                .body(data);
    }

    @GetMapping("/{channelId}/csv")
    public ResponseEntity<byte[]> exportCsv(@PathVariable UUID channelId) {
        byte[] data = exportService.exportCsv(channelId).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        attachment("messages-" + channelId + ".csv"))
                .body(data);
    }

    @GetMapping("/{channelId}/xml")
    public ResponseEntity<byte[]> exportXml(@PathVariable UUID channelId) {
        byte[] data = exportService.exportXml(channelId).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        attachment("messages-" + channelId + ".xml"))
                .body(data);
    }

    private String attachment(String filename) {
        return ContentDisposition.attachment().filename(filename).build().toString();
    }
}
