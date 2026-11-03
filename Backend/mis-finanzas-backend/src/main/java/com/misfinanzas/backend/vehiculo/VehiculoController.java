package com.misfinanzas.backend.vehiculo;

import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoRegistroDTO;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> crearVehiculo(@Valid @RequestBody VehiculoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(vehiculoService.crearVehiculo(registroDTO, usuario));
    }

    @GetMapping
    public ResponseEntity<List<VehiculoResponseDTO>> obtenerVehiculos(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(vehiculoService.obtenerVehiculos(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> obtenerVehiculo(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(vehiculoService.obtenerVehiculo(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> actualizarVehiculo(@PathVariable Long id, @Valid @RequestBody VehiculoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(vehiculoService.actualizarVehiculo(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        vehiculoService.eliminarVehiculo(id, usuario);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<VehiculoResponseDTO> cambiarEstado(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(vehiculoService.cambiarEstado(id, usuario));
    }
}
