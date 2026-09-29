package com.ideax.codemonitor.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "monitoring")
@Getter
@Setter
public class MonitoringProperties {

    private LargeCommit largeCommit = new LargeCommit();
    private SuddenActivity suddenActivity = new SuddenActivity();
    private BulkChange bulkChange = new BulkChange();

    @Getter
    @Setter
    public static class LargeCommit {
        private int filesThreshold = 100;
        private int linesThreshold = 5000;
    }

    @Getter
    @Setter
    public static class SuddenActivity {
        private int commitsThreshold = 10;
        private int windowMinutes = 15;
    }

    @Getter
    @Setter
    public static class BulkChange {
        private double filesFactor = 3.0;
    }
}
