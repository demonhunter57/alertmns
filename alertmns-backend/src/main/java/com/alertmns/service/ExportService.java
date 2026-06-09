package com.alertmns.service;

import com.alertmns.dto.response.MessageResponse;
import com.alertmns.repository.ChannelRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Service d'export des messages d'un canal dans différents formats.
 *
 * Formats supportés :
 *  - JSON : sérialisation Jackson de la liste des MessageResponse
 *  - CSV  : génération manuelle ligne par ligne (header + data)
 *  - XML  : génération manuelle sans dépendance JAXB externe
 *
 * Tous les exports sont en UTF-8.
 * Le canal doit exister, sinon HTTP 404.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final MessageService messageService;
    private final ChannelRepository channelRepository;

    public byte[] exportJson(UUID channelId) {
        validateChannel(channelId);
        List<MessageResponse> messages = messageService.getAllForExport(channelId);
        try {
            ObjectMapper mapper = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(messages);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "JSON export failed");
        }
    }

    public String exportCsv(UUID channelId) {
        validateChannel(channelId);
        List<MessageResponse> messages = messageService.getAllForExport(channelId);
        StringBuilder sb = new StringBuilder();
        sb.append("id,author,content,createdAt,editedAt\n");
        for (MessageResponse m : messages) {
            sb.append(escapeCsv(m.id().toString())).append(",");
            sb.append(escapeCsv(m.author().displayName())).append(",");
            sb.append(escapeCsv(m.content())).append(",");
            sb.append(m.createdAt() != null ? m.createdAt().toString() : "").append(",");
            sb.append(m.editedAt() != null ? m.editedAt().toString() : "");
            sb.append("\n");
        }
        return sb.toString();
    }

    public String exportXml(UUID channelId) {
        validateChannel(channelId);
        List<MessageResponse> messages = messageService.getAllForExport(channelId);
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<messages>\n");
        for (MessageResponse m : messages) {
            sb.append("  <message>\n");
            sb.append("    <id>").append(m.id()).append("</id>\n");
            sb.append("    <author>").append(escapeXml(m.author().displayName()))
                    .append("</author>\n");
            sb.append("    <content>").append(escapeXml(m.content())).append("</content>\n");
            sb.append("    <createdAt>").append(m.createdAt()).append("</createdAt>\n");
            if (m.editedAt() != null) {
                sb.append("    <editedAt>").append(m.editedAt()).append("</editedAt>\n");
            }
            sb.append("  </message>\n");
        }
        sb.append("</messages>");
        return sb.toString();
    }

    private void validateChannel(UUID channelId) {
        if (!channelRepository.existsById(channelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Channel not found");
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private String escapeXml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
