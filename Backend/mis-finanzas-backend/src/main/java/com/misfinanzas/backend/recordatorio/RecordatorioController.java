package com.misfinanzas.backend.recordatorio;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.recordatorio.model.Recordatorio;
import com.misfinanzas.backend.recordatorio.model.dto.RecordatorioDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// CRUD sencillo: el calendario calcula en el cliente en qué días caen los que se repiten
@RestController
@RequestMapping("/api/recordatorios")
public class RecordatorioController {

    private final RecordatorioRepository recordatorioRepository;

    public RecordatorioController(RecordatorioRepository recordatorioRepository) {
        this.recordatorioRepository = recordatorioRepository;
    }

    @GetMapping
    public ResponseEntity<List<RecordatorioDTO>> listar(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(recordatorioRepository.findByUsuarioIdOrderByFechaAsc(usuario.getId()).stream().map(this::convertir).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<RecordatorioDTO> crear(@Valid @RequestBody RecordatorioDTO dto, Authentication authentication) {

        Recordatorio recordatorio = new Recordatorio();

        copiar(dto, recordatorio);
        recordatorio.setUsuario((Usuario) authentication.getPrincipal());

        return ResponseEntity.status(HttpStatus.CREATED).body(convertir(recordatorioRepository.save(recordatorio)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<RecordatorioDTO> actualizar(@PathVariable Long id, @Valid @RequestBody RecordatorioDTO dto, Authentication authentication) {

        Recordatorio recordatorio = delUsuario(id, (Usuario) authentication.getPrincipal());

        copiar(dto, recordatorio);

        return ResponseEntity.ok(convertir(recordatorioRepository.save(recordatorio)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {

        recordatorioRepository.delete(delUsuario(id, (Usuario) authentication.getPrincipal()));

        return ResponseEntity.noContent().build();
    }

    private Recordatorio delUsuario(Long id, Usuario usuario) {

        return recordatorioRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Recordatorio no encontrado"));
    }

    private void copiar(RecordatorioDTO dto, Recordatorio recordatorio) {

        recordatorio.setTitulo(dto.getTitulo().trim());
        recordatorio.setFecha(dto.getFecha());
        recordatorio.setNota(dto.getNota() == null || dto.getNota().isBlank() ? null : dto.getNota().trim());
        recordatorio.setRepeticion(dto.getRepeticion());
    }

    private RecordatorioDTO convertir(Recordatorio r) {

        return new RecordatorioDTO(r.getId(), r.getTitulo(), r.getFecha(), r.getNota(), r.getRepeticion());
    }
}
