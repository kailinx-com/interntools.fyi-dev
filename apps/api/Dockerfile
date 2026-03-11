FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy Maven descriptor and resolve dependencies first (better layer caching)
COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

# Copy source and build the executable JAR
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built jar from the builder image
COPY --from=build /app/target/api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

