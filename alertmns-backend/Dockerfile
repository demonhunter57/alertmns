FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/alertmns-backend-1.0.0.jar app.jar
EXPOSE 4000
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]
