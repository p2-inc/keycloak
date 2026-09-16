package org.keycloak.quarkus.runtime.configuration.mappers;

import java.time.Duration;
import java.util.List;

import org.jboss.logging.Logger;

import org.keycloak.config.Option;
import org.keycloak.config.OptionsUtil;
import org.keycloak.config.TransactionOptions;
import org.keycloak.quarkus.runtime.cli.PropertyException;
import org.keycloak.quarkus.runtime.configuration.Configuration;

import io.quarkus.runtime.configuration.DurationConverter;
import io.smallrye.config.ConfigSourceInterceptorContext;
import io.smallrye.config.ConfigValue;

import static org.keycloak.quarkus.runtime.configuration.MicroProfileConfigProvider.NS_KEYCLOAK_PREFIX;
import static org.keycloak.quarkus.runtime.configuration.mappers.PropertyMapper.fromOption;

public class TransactionPropertyMappers implements PropertyMapperGrouping {

    private static final Logger logger = Logger.getLogger(TransactionPropertyMappers.class);
    private static final String QUARKUS_TXPROP_TARGET = "quarkus.datasource.jdbc.transactions";

    @Override
    public List<PropertyMapper<?>> getPropertyMappers() {
        return List.of(
                fromOption(TransactionOptions.TRANSACTION_XA_ENABLED)
                        .to(QUARKUS_TXPROP_TARGET)
                        .paramLabel(Boolean.TRUE + "|" + Boolean.FALSE)
                        .transformer(TransactionPropertyMappers::getQuarkusTransactionsValue)
                        .build(),
                fromOption(TransactionOptions.TRANSACTION_JTA_ENABLED)
                        .paramLabel(Boolean.TRUE + "|" + Boolean.FALSE)
                        .transformer(TransactionPropertyMappers::getQuarkusTransactionsValue)
                        .build(),
                fromOption(TransactionOptions.TRANSACTION_XA_ENABLED_DATASOURCE)
                        .to("quarkus.datasource.\"<datasource>\".jdbc.transactions")
                        .transformer(TransactionPropertyMappers::getQuarkusTransactionsValue)
                        .build(),
                fromOption(TransactionOptions.TRANSACTION_DEFAULT_TIMEOUT)
                        .to("quarkus.transaction-manager.default-transaction-timeout")
                        .validator(value -> validateDuration(TransactionOptions.TRANSACTION_DEFAULT_TIMEOUT, value))
                        .paramLabel("timeout")
                        .build(),
                fromOption(TransactionOptions.TRANSACTION_SETUP_TIMEOUT)
                        .to("kc.spi-connections-jpa--quarkus--migration-transaction-timeout")
                        .validator(value -> validateDuration(TransactionOptions.TRANSACTION_SETUP_TIMEOUT, value))
                        .paramLabel("timeout")
                        .build(),
                fromOption(TransactionOptions.TRANSACTION_SETUP_TIMEOUT)
                        .mapFrom(TransactionOptions.TRANSACTION_SETUP_TIMEOUT)
                        .to("kc.spi-dblock--jpa--lock-wait-timeout")
                        .paramLabel("timeout")
                        .build()
        );
    }

    private static String getQuarkusTransactionsValue(String txValue, ConfigSourceInterceptorContext context) {
        boolean isXaEnabled = Boolean.parseBoolean(txValue);
        boolean isJtaEnabled = getBooleanValue("kc.transaction-jta-enabled", context, true);
        logger.tracef("getQuarkusTransactionsValue isXaEnabled=%b isJtaEnabled=%b", isXaEnabled, isJtaEnabled);
        if (!isJtaEnabled) {
          return "disabled";
        }

        if (isXaEnabled) {
            return "xa";
        }

        return "enabled";
    }

  private static boolean getBooleanValue(String key, ConfigSourceInterceptorContext context, boolean defaultValue) {
    boolean returnValue = defaultValue;
    ConfigValue configValue = context.proceed(key);

    if (configValue != null) {
      returnValue = Boolean.parseBoolean(configValue.getValue());
    }
    return returnValue;
  }

    private static void validateDuration(Option<?> option, String value) {
        try {
            Duration duration = DurationConverter.parseDuration(value);
            if (duration == null || duration.isNegative() || duration.isZero()) {
                throw new PropertyException("Invalid duration '%s' for option '%s. Duration must be positive.".formatted(value, option.getKey()));
            }
        } catch (IllegalArgumentException e) {
            throw new PropertyException("Invalid duration format '%s' for option '%s'. %s".formatted(value, option.getKey(), OptionsUtil.DURATION_DESCRIPTION));
        }
    }
}
