angular.module('openmrs-module-registrationapp-fingerprint-search', ['pascalprecht.translate', 'openmrs-module-registrationapp-fingerprint-service'])


    .config(function ($translateProvider) {
        $translateProvider
            .useUrlLoader('/' +  OPENMRS_CONTEXT_PATH + '/module/uicommons/messages/messages.json',  {
                queryParameter : 'localeKey'
            })
            .useSanitizeValueStrategy('escape');
    })

    .controller('FingerprintSearchController', ['$scope', 'FingerprintService', '$translate',

        function($scope, FingerprintService, $translate) {

            $scope.scannerStatus;
            $scope.engineStatus;
            $scope.selectedScanner = null;
            $scope.buttonLabel = "registrationapp.biometrics.scan";
            $scope.scanningFingerInProgress = false;
            $scope.scanError = false;

            $scope.init = function(config, locale) {

                $scope.config = config;

                $translate.use(locale);

                FingerprintService.getScannerStatus($scope.config).then(function (scannerStatus) {
                    $scope.scannerStatus = scannerStatus;
                    if (scannerStatus.scanners.length) {
                        $scope.selectedScanner = scannerStatus.scanners[0];
                    }
                });

                FingerprintService.getEngineStatus().then(function (engineStatus) {
                    $scope.engineStatus = engineStatus.results;
                });
            }

            $scope.disableScanButton = function () {
                $scope.scanningFingerInProgress = true;
                $scope.buttonLabel = "registrationapp.biometrics.scanning";
            }

            $scope.enableScanButton = function() {
                $scope.scanningFingerInProgress = false;
                $scope.buttonLabel = "registrationapp.biometrics.scan";
                jq('#patient-search-form').trigger('search:enable');
            }

            $scope.scanFinger = function(finger) {

                jq('#patient-search-form').trigger('search:clear');
                jq('#patient-search-form').trigger('search:disable');

                $scope.scanError = false;
                $scope.disableScanButton();

                FingerprintService.scanFinger($scope.selectedScanner, { type: null, format: $scope.config.templateFormat }, $scope.config).then(function(data) {
                    if (data && data.template) {
                        FingerprintService.matchFinger(data.template).then(function (data) {
                            if (data && data.length > 0) {
                                // TODO sort by match score
                                var identifiers = [];
                                angular.forEach(data.reverse(), function (match) {
                                    identifiers.push(match.subjectId)
                                });
                                // TODO better way to do this than access jquery directly? how do we assure jquery is present?
                                jq('#patient-search-form').trigger('search:identifiers', identifiers);
                            }
                            else {
                                jq('#patient-search-form').trigger('search:no-matches');
                            }

                            $scope.enableScanButton();
                            $scope.$digest();
                        },
                        function (error) {
                            $scope.enableScanButton();
                            $scope.buttonLabel="registrationapp.biometrics.badscan";
                        });
                    }
                    else {
                        $scope.enableScanButton();
                        $scope.buttonLabel="registrationapp.biometrics.badscan";
                    }
                },
                function (error) {
                    $scope.enableScanButton();
                    $scope.buttonLabel="registrationapp.biometrics.badscan";
                });
            };

        }

    ]);

