package com.inchitech.radar.controller;

import com.inchitech.radar.service.FileUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

@RestController
@RequestMapping("/replays")
public class ReplayController {

    private static final Logger log = LoggerFactory.getLogger(ReplayController.class);

    private final FileUploadService fileUploadService;

    public ReplayController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadReplay(@RequestParam("file") MultipartFile file) throws IOException {
        Path stored = fileUploadService.storeReplayFile(file);
        log.info("Replay file uploaded to {}", stored);
        return ResponseEntity.ok().body(
                new UploadResponse("文件上传成功", stored.toString())
        );
    }

    private record UploadResponse(String message, String path) {}
}
