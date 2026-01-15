package org.keycloak.config;

import static org.keycloak.config.WildcardOptionsUtil.getWildcardNamedKey;

public class TransactionOptions {

    public static final Option<Boolean> TRANSACTION_XA_ENABLED_DATASOURCE = new OptionBuilder<>("transaction-xa-enabled-<datasource>", Boolean.class)
            .category(OptionCategory.TRANSACTION)
            .description("If set to true, XA for <datasource> datasource will be used.")
            .buildTime(true)
            .defaultValue(Boolean.TRUE)
            .build();

    public static final Option<Boolean> TRANSACTION_XA_ENABLED = new OptionBuilder<>("transaction-xa-enabled", Boolean.class)
            .category(OptionCategory.TRANSACTION)
            .description("If set to true, XA datasources will be used.")
            .buildTime(true)
            .defaultValue(Boolean.FALSE)
            .wildcardKey(TRANSACTION_XA_ENABLED_DATASOURCE.getKey())
            .build();

     public static final Option<Boolean> TRANSACTION_JTA_ENABLED = new OptionBuilder<>("transaction-jta-enabled", Boolean.class)
            .category(OptionCategory.TRANSACTION)
            .description("Set if distributed transactions are supported. If set to false, transactions are managed by the server and can not be joined if multiple data sources are used. By default, distributed transactions are enabled and only XA data sources can be used.")
            .buildTime(true)
            .defaultValue(Boolean.TRUE)
            .hidden()
            .build();

    public static String getNamedTxXADatasource(String namedProperty) {
        if ("<default>".equals(namedProperty)) {
            return TRANSACTION_XA_ENABLED.getKey();
        }
        return getWildcardNamedKey(TRANSACTION_XA_ENABLED_DATASOURCE.getKey(), namedProperty);
    }
}
