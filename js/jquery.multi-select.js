(function () {
    "use strict";

    angular
        .module("app.widgets")
        .directive("osMultiSelect", osMultiSelect);

    osMultiSelect.$inject = ["helperService", "$templateCache", "$timeout"];

    function osMultiSelect(helperService, $templateCache, $timeout) {
        var directive = {
            link: {
                pre: preLink,
                post: postLink
            },
            replace: true,
            restrict: "E",
            scope: {
                options: "=",
                multiSelectActionsObject: "=?"
            },
            template: $templateCache.get("template-cache/widgets/multi-select/os-multi-select.html")
        };
        return directive;

        function preLink(scope, element, attrs) {
            scope.multiSelectActionsObject = {};
            scope.groups = [];
        }

        function postLink(scope, element, attrs) {
            scope.multiSelectActionsObject.addOption = function (option) {
                addOption(option);
                refresh();
            }

            scope.multiSelectActionsObject.addOptionList = function (optionList) {
                optionList.forEach(function (option) {
                    addOption(option);
                });

                refresh();
            }

            scope.multiSelectActionsObject.selectOption = function (option) {
                selectOption(option);
                if (scope.options.selectableOptgroup) {
                    activeToggleItems();
                }
            }

            scope.multiSelectActionsObject.getSelectedItems = function () {
                return getSelectedItems();
            }

            scope.multiSelectActionsObject.refresh = function () {
                refresh();
            }

            initDirective();

            function initDirective() {
                var defaultOptions = {
                    selectableHeader: getSelectableHeader(),
                    selectionHeader: getSelectionHeader(),
                    afterInit: function (ms) {
                        var that = this,
                            $selectableSearch = that.$selectableUl.prev(),
                            $selectionSearch = that.$selectionUl.prev(),
                            selectableSearchString = "#" +
                                that.$container.attr("id") +
                                " .ms-elem-selectable:not(.ms-selected)",
                            selectionSearchString = "#" +
                                that.$container.attr("id") +
                                " .ms-elem-selection.ms-selected";

                        that.quickSearchSelectable = $selectableSearch.quicksearch(selectableSearchString).on("keydown",
                            function (e) {
                                if (e.which === 40) {
                                    that.$selectableUl.focus();
                                    return false;
                                }
                            });

                        that.quickSearchSelection = $selectionSearch.quicksearch(selectionSearchString).on("keydown",
                            function (e) {
                                if (e.which === 40) {
                                    that.$selectionUl.focus();
                                    return false;
                                }
                            });

                        activeSelectButtons();
                        scope.multiSelect = that;
                    },
                    afterSelect: function (values, quicksearchCacheOptions) {
                        this.quickSearchSelectable.cache(quicksearchCacheOptions);
                        this.quickSearchSelection.cache(quicksearchCacheOptions);
                        //hideSelectableOptions();
                    },
                    afterDeselect: function (values, quicksearchCacheOptions) {
                        this.quickSearchSelectable.cache(quicksearchCacheOptions);
                        this.quickSearchSelection.cache(quicksearchCacheOptions);
                        //hideSelectableOptions();
                    }
                }

                element.multiSelect(angular.isDefined(scope.options)
                    ? angular.extend(angular.copy(scope.options), defaultOptions)
                    : defaultOptions);
            }

            function getSelectableHeader() {
                var header = angular.element(
                    $templateCache.get("template-cache/widgets/multi-select/headers/selectable-header.html"));

                header.filter("label.selectable-text-header").text(attrs.selectableHeaderText);
                header.filter("button.selectable-select-all").text(helperService.getTranslation("SelectAll"));

                return header;
            }

            function getSelectionHeader() {
                var header = angular.element(
                    $templateCache.get("template-cache/widgets/multi-select/headers/selection-header.html"));

                header.filter("label.selection-text-header").text(attrs.selectionHeaderText);
                header.filter("button.selection-remove-all").text(helperService.getTranslation("RemoveAll"));

                return header;
            }

            function activeSelectButtons() {
                $timeout(function () {
                    var multiSelect = angular.element(element).next(".ms-container");
                    var selectAllButton = multiSelect.find("button.selectable-select-all");
                    var removeAllButton = multiSelect.find("button.selection-remove-all");

                    selectAllButton.on("click", function (e) {
                        selectAll(e);
                    });

                    removeAllButton.on("click", function (e) {
                        deselectAll(e);
                    });
                });
            }

            function addOption(option) {
                if (scope.options.selectableOptgroup) {
                    addGroup(option.nested);

                    var group = scope.groups.find(function (e) {
                        return e.label === option.nested;
                    });

                    group.options.push(option);
                } else {
                    angular.isDefined(scope.optionList) ? scope.optionList.push(option) : scope.optionList = [option];
                }
            }

            function activeToggleItems() {
                $timeout(function () {
                    var optGroup = angular.element(element).next(".ms-container").find("li.ms-optgroup-label");

                    optGroup.append("<i class='fa fa-forward multi-select-all-icon'></i>");
                    optGroup.prepend("<i class='" + attrs.groupsIcon + "'></i>");
                    optGroup.unbind().click(function (e) {
                        toggleOptGroups(e);
                    });
                    //hideSelectableOptions();
                });
            }

            function toggleOptGroups(e) {
                var target = angular.element(e.target);

                if (target.hasClass("multi-select-all-icon") === false) {
                    var hasActiveSearch = targetIsFromSelectable(target)
                        ? hasSelectableSearchActive()
                        : hasSelectionSearchActive();

                    e.preventDefault();

                    if (!hasActiveSearch) {
                        liElementsByTarget(target).toggle();
                    }
                } else {
                    var values = liElementsByTarget(target).map(function () {
                        return angular.element(this).attr("data-val");
                    }).get();

                    targetIsFromSelectable(target)
                        ? selectOption(values, { hideOptions: false })
                        : deselectOption(values, { hideOptions: false });
                }
            };

            function targetIsFromSelectable(target) {
                return target.closest("div.ms-selectable").length > 0;
            }

            function hasSelectableSearchActive() {
                return scope.multiSelect.quickSearchSelectable.val().length > 0;
            }

            function hasSelectionSearchActive() {
                return scope.multiSelect.quickSearchSelection.val().length > 0;
            }

            function liElementsByTarget(target) {
                return targetIsFromSelectable(target)
                    ? target.closest("ul.ms-optgroup").children().filter("li.ms-elem-selectable:not(.ms-selected, .disabled)")
                    : target.closest("ul.ms-optgroup").children().filter("li.ms-elem-selection.ms-selected");
            }

            function hideSelectableOptions() {
                angular.element(element).next(".ms-container").find("li.ms-elem-selectable").hide();
            }

            function hideSelectionOptions() {
                angular.element(element).next(".ms-container").find("li.ms-elem-selection").hide();
            }

            function addGroup(label) {
                if (scope.groups.every(function (e) { return e.label !== label; })) {
                    scope.groups.push({ label: label, options: [] });
                }

                return;
            }

            function getSelectedItems() {
                return angular.element(element)
                    .next("div.ms-container")
                    .find("div.ms-selection")
                    .find("li.ms-elem-selection:visible")
                    .map(function () {
                        return {
                            value: angular.element(this).attr("data-val"),
                            label: angular.element(this).next("span").text()
                        };
                    }).get();
            }

            function selectOption(option, quicksearchCacheOptions) {
                element.multiSelect("select", option, quicksearchCacheOptions);
            }

            function deselectOption(option, quicksearchCacheOptions) {
                element.multiSelect("deselect", option, quicksearchCacheOptions);
            }

            function selectAll(e, quicksearchCacheOptions) {
                e.preventDefault();
                element.multiSelect("select_all", quicksearchCacheOptions);
            }

            function deselectAll(e, quicksearchCacheOptions) {
                e.preventDefault();
                element.multiSelect("deselect_all", quicksearchCacheOptions);
            }

            function refresh() {
                $timeout(function () {
                    element.multiSelect("refresh");
                });
            }
        }
    }
})();
