<template>
  <main class="inicio">
    <section
      class="presentacion"
      aria-labelledby="titulo-principal"
    >
      <div class="marca">
        <span
          class="marca__pulso"
          aria-hidden="true"
        />
        <span>Estimate Arena</span>
      </div>

      <div class="presentacion__contenido">
        <div
          class="presentacion__numero"
          aria-hidden="true"
        >
          <strong>05</strong>
          <span>rondas</span>
        </div>
        <h1 id="titulo-principal">
          No necesitas saberlo. Necesitas acercarte.
        </h1>
        <p class="presentacion__descripcion">
          Cinco preguntas, treinta segundos y una sola estimación. La respuesta más cercana
          domina la arena.
        </p>
      </div>

      <dl
        class="reglas-rapidas"
        aria-label="Reglas principales"
      >
        <div>
          <dt>Rondas</dt>
          <dd>5</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>30 s</dd>
        </div>
        <div>
          <dt>Jugadores</dt>
          <dd>2–40</dd>
        </div>
      </dl>
    </section>

    <section
      class="acceso"
      aria-labelledby="titulo-acceso"
    >
      <div class="acceso__cabecera">
        <p class="acceso__estado">
          <span aria-hidden="true" /> Arena disponible
        </p>
        <h2 id="titulo-acceso">
          Elige tu entrada
        </h2>
        <p>Crea una sala para dirigir el juego o usa el código que ves en pantalla.</p>
      </div>

      <div
        class="acciones"
        role="group"
        aria-label="Opciones de acceso"
      >
        <button
          class="boton boton--principal"
          type="button"
          disabled
        >
          Crear una partida
        </button>
        <button
          class="boton boton--secundario"
          type="button"
          disabled
        >
          Ingresar con código
        </button>
      </div>

      <p class="acceso__nota">
        La conexión de estas acciones se incorpora en el siguiente módulo.
      </p>
    </section>
  </main>
</template>

<style scoped>
.inicio {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 0.75fr);
}

.presentacion,
.acceso {
  padding: clamp(1.5rem, 4vw, 4rem);
}

.presentacion {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--color-tinta);
  color: var(--color-papel);
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.82rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.marca__pulso {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--color-acento);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--color-acento) 18%, transparent);
}

.presentacion__contenido {
  display: grid;
  grid-template-columns: minmax(4rem, 0.22fr) minmax(0, 1fr);
  column-gap: clamp(1rem, 4vw, 4rem);
  align-items: start;
  max-width: 68rem;
}

.presentacion__numero {
  display: grid;
  gap: 0.35rem;
  margin: 0.45rem 0 0;
  color: var(--color-acento);
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
}

.presentacion__numero strong {
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 800;
}

.presentacion__numero span {
  font-size: 0.75rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  grid-column: 2;
  max-width: 13ch;
  margin: 0;
  font-size: clamp(3.2rem, 7.4vw, 6rem);
  font-weight: 780;
  letter-spacing: -0.04em;
  line-height: 0.9;
  text-wrap: balance;
}

.presentacion__descripcion {
  grid-column: 2;
  max-width: 39rem;
  margin: 2rem 0 0;
  color: var(--color-papel-secundario);
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  line-height: 1.55;
}

.reglas-rapidas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 3rem 0 0;
  border-top: 1px solid var(--color-linea-oscura);
}

.reglas-rapidas div {
  padding: 1.1rem 1rem 0 0;
}

.reglas-rapidas div + div {
  padding-left: 1rem;
  border-left: 1px solid var(--color-linea-oscura);
}

.reglas-rapidas dt {
  color: var(--color-papel-secundario);
  font-size: 0.76rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.reglas-rapidas dd {
  margin: 0.4rem 0 0;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}

.acceso {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  justify-content: center;
  background: var(--color-papel);
  color: var(--color-tinta);
}

.acceso__cabecera,
.acciones,
.acceso__nota {
  width: min(100%, 29rem);
  margin-inline: auto;
}

.acceso__estado {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 3rem;
  color: var(--color-texto-suave);
  font-size: 0.82rem;
  font-weight: 680;
}

.acceso__estado span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-exito);
}

h2 {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  font-weight: 760;
  letter-spacing: -0.035em;
  line-height: 1;
}

.acceso__cabecera > p:last-child {
  max-width: 37ch;
  margin: 1.25rem 0 0;
  color: var(--color-texto-suave);
  line-height: 1.55;
}

.acciones {
  display: grid;
  gap: 0.75rem;
  margin-top: 2.5rem;
}

.acceso__nota {
  margin-top: 1.5rem;
  color: var(--color-texto-suave);
  font-size: 0.78rem;
  line-height: 1.5;
}

@media (max-width: 800px) {
  .inicio {
    display: flex;
    flex-direction: column;
  }

  .presentacion,
  .acceso {
    min-height: auto;
  }

  .presentacion {
    min-height: 62dvh;
    gap: 4rem;
  }

  .presentacion__contenido {
    grid-template-columns: 1fr;
  }

  .presentacion__numero {
    margin-bottom: 1rem;
  }

  h1,
  .presentacion__descripcion {
    grid-column: 1;
  }

  h1 {
    font-size: clamp(3rem, 14vw, 5rem);
  }

  .acceso {
    order: -1;
    padding-block: 4rem;
  }
}

@media (max-width: 420px) {
  .presentacion,
  .acceso {
    padding-inline: 1.25rem;
  }

  .reglas-rapidas div {
    padding-right: 0.55rem;
  }

  .reglas-rapidas div + div {
    padding-left: 0.55rem;
  }

  .reglas-rapidas dt {
    font-size: 0.64rem;
  }
}
</style>
