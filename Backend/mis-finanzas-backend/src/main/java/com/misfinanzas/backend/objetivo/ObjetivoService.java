package com.misfinanzas.backend.objetivo;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.objetivo.model.Aportacion;
import com.misfinanzas.backend.objetivo.model.Objetivo;
import com.misfinanzas.backend.objetivo.model.dto.AportacionRegistroDTO;
import com.misfinanzas.backend.objetivo.model.dto.AportacionResponseDTO;
import com.misfinanzas.backend.objetivo.model.dto.ObjetivoRegistroDTO;
import com.misfinanzas.backend.objetivo.model.dto.ObjetivoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ObjetivoService {

    private final ObjetivoRepository objetivoRepository;

    public ObjetivoService(ObjetivoRepository objetivoRepository) {
        this.objetivoRepository = objetivoRepository;
    }

    @Transactional
    public ObjetivoResponseDTO crear(ObjetivoRegistroDTO dto, Usuario usuario) {

        Objetivo objetivo = new Objetivo();

        copiar(dto, objetivo);
        objetivo.setCreadoEn(LocalDate.now());
        objetivo.setUsuario(usuario);

        return convertir(objetivoRepository.save(objetivo));
    }

    @Transactional(readOnly = true)
    public List<ObjetivoResponseDTO> listar(Usuario usuario) {

        return objetivoRepository.findByUsuarioIdOrderByCreadoEnDescIdDesc(usuario.getId()).stream().map(this::convertir).toList();
    }

    @Transactional(readOnly = true)
    public ObjetivoResponseDTO obtener(Long id, Usuario usuario) {

        return convertir(delUsuario(id, usuario));
    }

    @Transactional
    public ObjetivoResponseDTO actualizar(Long id, ObjetivoRegistroDTO dto, Usuario usuario) {

        Objetivo objetivo = delUsuario(id, usuario);

        copiar(dto, objetivo);

        return convertir(objetivoRepository.save(objetivo));
    }

    @Transactional
    public void eliminar(Long id, Usuario usuario) {

        objetivoRepository.delete(delUsuario(id, usuario));
    }

    @Transactional
    public ObjetivoResponseDTO aportar(Long id, AportacionRegistroDTO dto, Usuario usuario) {

        Objetivo objetivo = delUsuario(id, usuario);

        if (dto.getImporte().signum() == 0) {
            throw new IllegalArgumentException("El importe no puede ser 0");
        }

        // No se puede sacar más de lo que hay ahorrado
        if (ahorrado(objetivo).add(dto.getImporte()).signum() < 0) {
            throw new IllegalArgumentException("No puedes retirar más de lo que llevas ahorrado");
        }

        Aportacion aportacion = new Aportacion();

        aportacion.setImporte(dto.getImporte().setScale(2, RoundingMode.HALF_UP));
        aportacion.setFecha(dto.getFecha());
        aportacion.setNota(dto.getNota() == null || dto.getNota().isBlank() ? null : dto.getNota().trim());
        aportacion.setObjetivo(objetivo);

        objetivo.getAportaciones().add(aportacion);

        return convertir(objetivoRepository.save(objetivo));
    }

    @Transactional
    public ObjetivoResponseDTO eliminarAportacion(Long id, Long aportacionId, Usuario usuario) {

        Objetivo objetivo = delUsuario(id, usuario);

        boolean quitada = objetivo.getAportaciones().removeIf(a -> a.getId().equals(aportacionId));

        if (!quitada) {
            throw new RecursoNoEncontradoException("Aportación no encontrada");
        }

        if (ahorrado(objetivo).signum() < 0) {
            throw new IllegalArgumentException("Sin esa aportación lo ahorrado quedaría en negativo: borra antes alguna retirada");
        }

        return convertir(objetivoRepository.save(objetivo));
    }

    private void copiar(ObjetivoRegistroDTO dto, Objetivo objetivo) {

        objetivo.setNombre(dto.getNombre().trim());
        objetivo.setImporteObjetivo(dto.getImporteObjetivo());
        objetivo.setFechaLimite(dto.getFechaLimite());
        objetivo.setIcono(dto.getIcono());
    }

    private Objetivo delUsuario(Long id, Usuario usuario) {

        return objetivoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Objetivo no encontrado"));
    }

    private BigDecimal ahorrado(Objetivo objetivo) {

        return objetivo.getAportaciones().stream().map(Aportacion::getImporte).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ObjetivoResponseDTO convertir(Objetivo objetivo) {

        BigDecimal ahorrado = ahorrado(objetivo);
        BigDecimal meta = objetivo.getImporteObjetivo();
        BigDecimal restante = meta.subtract(ahorrado).max(BigDecimal.ZERO);
        boolean completado = restante.signum() == 0;
        int porcentaje = ahorrado.multiply(BigDecimal.valueOf(100)).divide(meta, 0, RoundingMode.DOWN).intValue();

        Integer meses = null;
        BigDecimal mensual = null;

        if (objetivo.getFechaLimite() != null) {

            // Meses que quedan contando el actual: hasta fin de noviembre con fecha en noviembre = 1
            long diferencia = ChronoUnit.MONTHS.between(YearMonth.now(), YearMonth.from(objetivo.getFechaLimite())) + 1;
            meses = (int) Math.max(diferencia, 0);

            if (!completado && meses > 0) {
                mensual = restante.divide(BigDecimal.valueOf(meses), 2, RoundingMode.UP);
            }
        }

        List<AportacionResponseDTO> aportaciones = objetivo.getAportaciones().stream()
                .map(a -> new AportacionResponseDTO(a.getId(), a.getImporte(), a.getFecha(), a.getNota()))
                .toList();

        return new ObjetivoResponseDTO(
                objetivo.getId(),
                objetivo.getNombre(),
                meta,
                objetivo.getFechaLimite(),
                objetivo.getIcono(),
                objetivo.getCreadoEn(),
                ahorrado,
                restante,
                Math.max(porcentaje, 0),
                completado,
                mensual,
                meses,
                aportaciones
        );
    }
}
