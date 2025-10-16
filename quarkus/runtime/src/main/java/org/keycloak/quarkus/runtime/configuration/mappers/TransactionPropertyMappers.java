package org.keycloak.quarkus.runtime.configuration.mappers;

import io.smallrye.config.ConfigSourceInterceptorContext;
import io.smallrye.config.ConfigValue;

import org.keycloak.config.TransactionOptions;
import org.keycloak.quarkus.runtime.configuration.Configuration;

import static org.keycloak.quarkus.runtime.configuration.MicroProfileConfigProvider.NS_KEYCLOAK_PREFIX;
import static org.keycloak.quarkus.runtime.configuration.mappers.PropertyMapper.fromOption;

import java.util.List;

import org.jboss.logging.Logger;

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

}
