FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY packages/connectors/java/pom.xml ./pom.xml
COPY packages/connectors/java/core-client/pom.xml core-client/pom.xml
COPY packages/connectors/java/connector-template/pom.xml connector-template/pom.xml
COPY packages/connectors/java/examples/http-forwarder/pom.xml examples/http-forwarder/pom.xml

RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -e -B dependency:go-offline && \
    echo "Connector Dockerfile scaffold ready. Add source files + package steps in US3."

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /srv/connector
CMD ["bash", "-lc", "echo 'Connector container placeholder – build Spring Boot app during US3' && tail -f /dev/null"]
