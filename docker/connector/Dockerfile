FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy Maven project
COPY packages/connectors/java/ .

# Fetch dependencies and build the http-forwarder example (brings in template + client)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -B -pl examples/http-forwarder -am dependency:go-offline && \
    mvn -q -B -pl examples/http-forwarder -am package

FROM eclipse-temurin:21-jre AS runtime
ENV APP_HOME=/srv/connector \
    JAVA_OPTS=""
WORKDIR ${APP_HOME}

COPY --from=build /workspace/examples/http-forwarder/target/http-forwarder-*.jar ${APP_HOME}/app.jar
COPY docker/connector/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN addgroup --system connector && \
    adduser --system --home ${APP_HOME} --ingroup connector connector && \
    chown -R connector:connector ${APP_HOME} && \
    chmod +x /usr/local/bin/entrypoint.sh

USER connector
EXPOSE 8082

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
