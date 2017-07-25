(function ($, window, document, undefined) {
    'use strict';

    var pluginName = 'multistepForm';
    var defaults = {
            labels: {
                next: 'Next',
                previous: 'Previous',
                submit: 'Submit'
            },
            navigation: {
                itemTemplate: '<span class="bubble"></span>#title#',
                beforeNavigate: null
            },
            animation: {
                duration: 400
            },
            progressTemplate: 'Step #position# of #total#',
            beforeNext: null,
            beforePrevious: null,
            beforeSubmit: null,
            maxWidth: null
        };

    var bindEvents = function () {
        var _ = this;

        if (_.settings.navigation && _.settings.navigation.itemTemplate) {
            _.$form.on('click', '#ms-navigation li', function () {
                var $navigationItem = $(this);

                if ($navigationItem.hasClass('disabled')) {

                    return;

                }

                if (typeof _.settings.navigation.beforeNavigate === 'function') {
                    var event = $.Event('beforeNavigate');

                    var values = _.getValues.call(_, _.currentIndex);

                    event.data = {
                        currentIndex: _.currentIndex,
                        values: values
                    };

                    _.settings.navigation.beforeNavigate.call(_, event);

                    if (event.isDefaultPrevented()) {

                        return;

                    }
                }
                _.navigate($navigationItem.data('ms-step-index'));
            });
        }

        _.$form.on('click', '.btn-next', function() {
            if (typeof _.settings.beforeNext === 'function') {
                var event = $.Event('beforeNext');

                var values = _.getValues.call(_, _.currentIndex);

                event.data = {
                    currentIndex: _.currentIndex,
                    values: values
                };

                _.settings.beforeNext.call(_, event);

                if (event.isDefaultPrevented()) {

                    return;

                }
            }
            _.next();
        });

        _.$form.on('click', '.btn-previous', function() {
            if (typeof _.settings.beforePrevious === 'function') {
                var event = $.Event('beforePrevious');

                var values = _.getValues.call(_, _.currentIndex);

                event.data = {
                    currentIndex: _.currentIndex,
                    values: values
                };

                _.settings.beforePrevious.call(_, event);

                if (event.isDefaultPrevented()) {

                    return;

                }
            }
            _.previous();
        });

        _.$form.on('change', ':file', function() {
            var input = $(this);

            var numFiles = input.get(0).files ? input.get(0).files.length : 1;

            var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
            
            input.trigger('fileselect', [numFiles, label]);
        });

        _.$form.on('fileselect', ':file', function(event, numFiles, label) {

            var input = $(this).parents('.input-group').find(':text'),
            log = numFiles > 1 ? numFiles + ' files selected' : label;

            if( input.length ) {
                input.val(log);
            } else {
                if( log ) alert(log);
            }

        });

        if (typeof _.settings.beforeSubmit === 'function') {

            _.$form.on('click', 'input[type="submit"]', function (e) {

                _.settings.beforeSubmit.call(_, e);

            });

        }
    };

    var buildBottom = function (step, currentStepIndex) {
        var _ = this;

        var bottom = document.createElement('div');

        bottom.className = 'panel-body';

        if (step.querySelector('[id^="rbi_"]') !== null) {
            var element = step.querySelector('[id^="rbi_"]').parentNode.parentNode;

            var rows = getImmediateChildElementsByTagName(element, 'tr');

            var numRows = rows.length;

            if (numRows > 0) {
                var numCols = getColumnCount(rows[0]);

                for (var a = 0; a < numRows; a++) {
                    var row = document.createElement('div');

                    row.className = 'row';

                    var rowNodes = getImmediateChildElementsByTagName(rows[a], 'td');

                    for (var b = 0; b < numCols; b++) {
                        var col = document.createElement('div');

                        col.className = 'col-lg-' + 12 / numCols;

                        var colNodes = getColumnNodes(rowNodes, b);

                        if (colNodes.length > 1) {
                            
                            col.appendChild(buildGroup.call(_, colNodes, currentStepIndex));

                        } else if (colNodes.length === 1 && colNodes[0].className === 'detailHTMLCol') {

                            var group = document.createElement('div');

                            group.className = 'detail-html';

                            group.innerHTML = colNodes[0].innerHTML;

                            col.appendChild(group);

                        }

                        row.appendChild(col);
                    }

                    bottom.appendChild(row);
                }
            }
        }

        return bottom;
    };

    var buildGroup = function (colNodes, currentStepIndex) {
        var _ = this;

        var formControlTypes = ['text', 'textarea', 'select-one', 'select-multiple'];

        var group = document.createElement('div');

        group.className = 'form-group';

        var labelNode = colNodes[0];

        var fieldNode = colNodes[1];

        var fieldType = getFieldType(fieldNode);

        var label = buildLabel(labelNode, fieldNode.firstChild.id);

        switch (fieldType) {
            case 'group':
                var fieldNodeLabels = fieldNode.getElementsByTagName('label');

                var newFields = document.createDocumentFragment();

                var numFieldNodeLabels = fieldNodeLabels.length;

                for (var a = 0; a < numFieldNodeLabels; a++) {

                    var field = fieldNode.querySelector('#' + fieldNodeLabels[a].htmlFor);

                    fieldNodeLabels[a].insertBefore(field, fieldNodeLabels[a].firstChild);

                    var newListElement = document.createElement('div');

                    newListElement.className = field.type;
                    newListElement.appendChild(fieldNodeLabels[a].cloneNode(true));

                    newFields.appendChild(newListElement);

                }

                group.appendChild(label);

                group.appendChild(newFields);

                break;
            case 'dependent-picklist':
                var newId = fieldNode.childNodes[3].name + Date.now();

                label = buildLabel(labelNode, newId);

                group.appendChild(label);

                var input = fieldNode.childNodes[3];

                input.id = newId;

                input.className += ' form-control';

                group.appendChild(input);

                var script = fieldNode.childNodes[1];

                input.appendChild(script);

                break;
            case 'checkbox':
                var checkboxElement = document.createElement('div');

                checkboxElement.className = 'checkbox';

                label.insertBefore(fieldNode.firstChild, label.firstChild);

                checkboxElement.appendChild(label);

                group.appendChild(checkboxElement);

                break;
            case 'percent':
                group.appendChild(label);

                var inputGroup = document.createElement('div');

                inputGroup.className = 'input-group';

                var input = fieldNode.querySelector('input');

                input.className += ' form-control';

                inputGroup.appendChild(input);

                var addOn = document.createElement('span');

                addOn.className = 'input-group-addon';

                addOn.innerHTML = '%';

                inputGroup.appendChild(addOn);

                group.appendChild(inputGroup);

                break;
            case 'password':
                group.appendChild(label);

                var passwordInputs = fieldNode.getElementsByTagName('input');

                for (var a = 0; a < 2; a++) {

                    if (a == 1) {
                        var confirmLabel = document.createElement('label');

                        confirmLabel.htmlFor = passwordInputs[0].id;
                        confirmLabel.innerHTML = labelNode.childNodes[2].nodeValue;

                        group.appendChild(confirmLabel);
                    }

                    var input = passwordInputs[0];

                    input.className += ' form-control';

                    group.appendChild(input);
                }

                break;
            case 'time':
                var row = document.createElement('div');

                row.className = 'row';

                fieldNode.removeChild(fieldNode.childNodes[1]);

                for (var a = 0; a < 2; a++) {

                    var col = document.createElement('div');

                    var nodeContainer;

                    var node;

                    col.className = 'col-xs-6';

                    nodeContainer = document.createElement('div');

                    nodeContainer.className = 'form-group';

                    node = fieldNode.childNodes[0];

                    if (formControlTypes.indexOf(node.type) !== -1) {

                        node.className += ' form-control';

                    }

                    nodeContainer.appendChild(node);

                    col.appendChild(nodeContainer);

                    row.appendChild(col);
                    
                }

                group.appendChild(label);

                group.appendChild(row);

                break;
            case 'date-time':
                group.appendChild(label);

                var inputGroup = document.createElement('div');

                inputGroup.className = 'input-group';

                var input = fieldNode.querySelector('input');

                input.className += ' form-control';

                inputGroup.appendChild(input);

                var addOn = document.createElement('span');

                addOn.className = 'input-group-btn';

                var openCalendar = fieldNode.querySelector('[onclick^="return rbf_openCalendar"]');

                openCalendar.className = 'btn btn-default';

                addOn.appendChild(openCalendar);

                inputGroup.appendChild(addOn);

                group.appendChild(inputGroup);

                break;
            case 'file':
                var input = fieldNode.querySelector('[type=file]');

                input.setAttribute('style', 'display: none;');

                var inputGroup = document.createElement('div');

                inputGroup.className = 'input-group';

                var newLabel = document.createElement('label');

                newLabel.className = 'input-group-btn';

                var newButton = document.createElement('span');

                newButton.className = 'btn btn-default';

                newButton.innerHTML = 'Choose File';

                newButton.appendChild(input);

                newLabel.appendChild(newButton);

                inputGroup.appendChild(newLabel);

                var newFeedback = document.createElement('input');

                newFeedback.setAttribute('type', 'text');

                newFeedback.setAttribute('readonly', true);

                newFeedback.className = 'form-control';

                inputGroup.appendChild(newFeedback);

                group.appendChild(inputGroup);

                var helpText = document.createElement('span');

                helpText.className = 'help-block';

                var oldHelp = fieldNode.querySelector('font');

                helpText.innerHTML = oldHelp.innerHTML;

                group.appendChild(helpText);

                break;
            case 'default':
                group.appendChild(label);

                var input = fieldNode.childNodes[0];

                if (formControlTypes.indexOf(input.type) !== -1) {

                    input.className += ' form-control';

                }

                group.appendChild(input);
        }

        var error = fieldNode.querySelector('font');

        if (error !== null && error.getAttribute('color') === '#990000') {
            var errorElement = document.createElement('p');

            errorElement.className = 'error text-danger';

            errorElement.innerHTML = error.innerHTML;

            group.appendChild(errorElement);

            if (_.error === -1) {

                _.error = currentStepIndex;

            }
        }

        return group;
    };

    var buildLabel = function (labelNode, fieldId) {
        var numChild = labelNode.childNodes.length;

        for (var a = 0; a < numChild; a++) {

            if (labelNode.childNodes[a].nodeType != Node.TEXT_NODE) {

                return labelNode.removeChild(labelNode.childNodes[a]);

            } else {

                if (!/^\s*$/.test(labelNode.childNodes[a].nodeValue)) {
                    var label = document.createElement('label');

                    label.htmlFor = fieldId;
                    label.innerHTML = labelNode.childNodes[a].nodeValue;

                    return label;
                }

            }

        }
    };

    var buildNavigation = function (steps) {
        var _ = this;

        var navigation = document.createElement('ul');

        navigation.id = 'ms-navigation';

        var numSteps = steps.length;

        for (var a = 0; a < numSteps; a++) {
            var map = {
                position: a + 1,
                title: steps[a].getAttribute('name').replace('[multistep]', '')
            };

            var item = document.createElement('li');

            item.className = 'disabled';
            item.setAttribute('data-ms-step-index', a);

            item.innerHTML = renderTemplate(_.settings.navigation.itemTemplate, map);

            navigation.appendChild(item);
        }

        return navigation;
    };

    var buildNotificationSection = function (element) {
        var section = document.createElement('div');

        section.id = 'ms-notification';

        var p = document.createElement('p');

        p.innerHTML = element.innerHTML;

        section.appendChild(p);

        return section;
    };

    var buildStaticSection = function (element, id) {
        var section = document.createElement('div');

        section.id = id;

        var inner = element.getElementsByClassName('detailHTMLCol')[0];

        var numChildren = inner.childNodes.length;

        if (inner && numChildren > 0) {
            for (var a = 0; a < numChildren; a++) {
                section.appendChild(inner.childNodes[a].cloneNode(true));
            }
        }

        return section;
    };

    var buildStep = function (step, currentStepIndex, totalStepCount) {
        var _ = this;

        var fieldset = document.createElement('fieldset');

        fieldset.className = 'panel panel-default';

        fieldset.setAttribute('style', 'display: none;');
        fieldset.appendChild(buildTop.call(_, step, currentStepIndex, totalStepCount));
        fieldset.appendChild(buildBottom.call(_, step, currentStepIndex));

        var controls = document.createDocumentFragment();

        if (currentStepIndex !== 0) {
            var previous = document.createElement('button');

            previous.className = 'btn btn-default btn-previous';
            previous.type = 'button';
            previous.innerHTML = _.settings.labels.previous;
            controls.appendChild(previous);
        }

        if (currentStepIndex < totalStepCount - 1) {
            var next = document.createElement('button');

            next.className = 'btn btn-default btn-next';
            next.type = 'button';
            next.innerHTML = _.settings.labels.next;
            controls.appendChild(next);
        }

        var bottom = fieldset.getElementsByClassName('panel-body')[0];

        bottom.appendChild(controls);

        return fieldset;
    };

    var buildStepSection = function (steps) {
        var _ = this;

        var numSteps = steps.length;

        var newSteps = document.createDocumentFragment();

        for (var a = 0; a < numSteps; a++) {
            var step = buildStep.call(_, steps[a], a, numSteps);

            newSteps.appendChild(step);
        }

        var section = document.createElement('div');

        section.id = 'ms-steps';

        section.appendChild(newSteps);

        return section;
    };

    var buildTop = function (step, currentStepIndex, totalStepCount) {
        var _ = this;

        var top = document.createElement('div');

        top.className = 'panel-heading clearfix';

        if (_.settings.progressTemplate) {
            var map = {
                position: currentStepIndex + 1,
                total: totalStepCount
            };

            var progress = document.createElement('p');

            progress.className = 'ms-progress pull-right';
            progress.innerHTML = renderTemplate(_.settings.progressTemplate, map);

            top.appendChild(progress);
        }

        var title = document.createElement('h3');

        title.className = 'panel-title pull-left';
        title.innerHTML = step.getAttribute('name').replace('[multistep]', '');

        top.appendChild(title);

        return top;
    };

    var getColumnCount = function (element) {
        var count = 0;

        var cells = getImmediateChildElementsByTagName(element, 'td');

        var numCells = cells.length;

        for (var a = 0; a < numCells; a++) {

            if (cells[a].colSpan > 1) {
                count += cells[a].colSpan;
            } else {
                count += 1;
            }

        }

        return count / 2;
    };

    var getColumnNodes = function (rowNodes, columnIndex) {
        var curCount = 0;

        var skipCount = columnIndex * 2;

        var numNodes = rowNodes.length;

        var colNodes = [];

        for (var a = 0; a < numNodes; a++) {

            if (skipCount !== 0) {

                skipCount -= rowNodes[a].colSpan;

                continue;

            }
            
            colNodes.push(rowNodes[a].cloneNode(true));
            
            curCount += rowNodes[a].colSpan;

            if (curCount === 2) {

                break;

            }
        }

        return colNodes;
    };

    var getFieldType = function (fieldNode) {
        var fieldNodeLabels = fieldNode.getElementsByTagName('label');

        if (fieldNodeLabels.length > 0) {

            return 'group';

        }

        var scriptNodes = fieldNode.getElementsByTagName('script');

        if (scriptNodes.length === 1) {
            
            return 'dependent-picklist';

        }

        if (fieldNode.firstChild.type === 'checkbox') {
            
            return 'checkbox';

        }

        var textNodes = getTextNodesUnder(fieldNode);

        if (textNodes.length === 1 && textNodes[0].nodeValue === ' %') {

            return 'percent';

        }

        if (fieldNode.firstChild.type === 'password') {

            return 'password';

        }

        var hours = fieldNode.querySelector('[name$=_hrs]');

        if (hours !== null && hours.type === 'select-one') {
            
            return 'time';

        }

        var openCalendar = fieldNode.querySelector('[onclick^="return rbf_openCalendar"]');

        if (openCalendar !== null) {

            return 'date-time';

        }

        var fileSelect = fieldNode.querySelector('[type=file]');

        if (fileSelect !== null) {

            return 'file';

        }

        return 'default';
    };

    var getImmediateChildElementsByTagName = function (element, tagName) {
        var nodes = element.getElementsByTagName(tagName);

        nodes = Array.prototype.slice.call(nodes);
        
        return nodes.filter(function (v, i) {

            return v.parentElement === element;

        });
    };

    var getTextNodesUnder = function (element) {
        var node;

        var textNodes = [];

        var walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);

        while (node = walk.nextNode()) {

            textNodes.push(node);

        }

        return textNodes;
    };

    var init = function () {
        var _ = this;

        var notification = document.getElementById('rb_infoMessageText');

        var header = _.element.querySelector('[name^=\\[multistep-header\\]]');

        var steps = _.element.querySelectorAll('[name^=\\[multistep\\]]');

        var footer = _.element.querySelector('[name^=\\[multistep-footer\\]]');

        var script = _.element.querySelector('[name^=\\[multistep-script\\]]');

        if (steps.length < 2) {

            return;

        }

        _.parent.removeChild(_.element);

        var newForm = document.createElement('div');

        newForm.id = 'ms-form';
        newForm.className = 'container';

        if (_.settings.maxWidth !== null) {

            newForm.setAttribute('style', 'max-width:' + _.settings.maxWidth);

        }

        if (notification !== null) {

            newForm.appendChild(buildNotificationSection(notification));

        }

        if (header !== null) {

            newForm.appendChild(buildStaticSection(header, 'ms-header'));

        }

        if (_.settings.navigation && _.settings.navigation.itemTemplate) {

            newForm.appendChild(buildNavigation.call(_, steps));

        }

        newForm.appendChild(buildStepSection.call(_, steps));

        if (footer !== null) {

            newForm.appendChild(buildStaticSection(footer, 'ms-footer'));

        }

        var submit = _.element.querySelector('[type="submit"]');

        submit.className = 'btn btn-primary';
        submit.value = _.settings.labels.submit;

        var nodes = newForm.getElementsByTagName('fieldset');

        nodes[nodes.length - 1].getElementsByClassName('panel-body')[0].appendChild(submit);

        _.parent.appendChild(newForm);

        if (script !== null) {

            var detailHTMLCol = script.querySelector('.detailHTMLCol');

            if (detailHTMLCol !== null) {

                for (var a = 0, b = detailHTMLCol.children.length; a < b; a++) {

                    _.parent.appendChild(detailHTMLCol.children[0]);

                }

            }

        }

        _.$form = $(newForm);

        bindEvents.call(_);
    };

    var renderTemplate = function (template, map) {
        var r = new RegExp('#' + Object.keys(map).join('#|#') + '#', 'gi');

        return template.replace(r, function (matched) {

          return map[matched.slice(1, -1)];

        });
    };

    var slice = function (elements, start, end) {

        return Array.prototype.slice.call(elements, start, end);

    };

    function MultistepForm(element, options) {
        var _ = this;

        _.settings = $.extend(true, {}, defaults, options);

        _.element = element;
        _.$form = null;
        _.parent = _.element.parentNode;
        _.currentIndex = 0;
        _.error = -1;

        init.call(_);

        var notification = document.getElementById('ms-notification');

        if (notification !== null) {

            setTimeout(function() {

                $(notification).fadeOut(400);

            }, 5000);
        }

        var stepToShow = (_.error === -1) ? 0 : _.error;

        if (stepToShow !== 0) {

            _.updateNavigation('completed', 0, stepToShow);

        }

        _.showStep(stepToShow);
    }

    $.extend(MultistepForm.prototype, {
        getValues: function (index) {
            var _ = this;

            var data = _.$form.find('fieldset').eq(index).find(':input').serialize();

            return data.split('&').reduce(function (values, param) {

                var paramSplit = param.split('=').map(function (value) {

                    return decodeURIComponent(value.replace('+', ' '));

                });

                values[paramSplit[0]] = paramSplit[1];

                return values;

            }, {});
        },

        navigate: function (index) {
            var _ = this;

            _.updateNavigation('completed', _.currentIndex);
            _.showStep(index);
        },

        next: function () {
            var _ = this;

            _.updateNavigation('completed', _.currentIndex);
            _.showStep(_.currentIndex + 1);
        },

        previous: function () {
            var _ = this;

            _.showStep(_.currentIndex - 1);
        },

        showStep: function (index) {
            var _ = this;

            var $steps = _.$form.find('fieldset');

            _.$form.find('#ms-navigation li').eq(_.currentIndex).removeClass('active');
            _.updateNavigation('active', index);

            if (_.settings.animation) {

                $steps.eq(_.currentIndex).fadeOut(_.settings.animation.duration, function () {

                    $steps.eq(index).fadeIn(_.settings.animation.duration, function () {

                        _.currentIndex = index;

                    });
                });

            } else {

                $steps.eq(_.currentIndex).hide();

                $steps.eq(index).show();

                _.currentIndex = index;
            }
        },

        updateNavigation: function (status, indexStart, indexStop) {
            var _ = this;

            indexStop = indexStop || indexStart + 1;

            var $navigationItems = _.$form.find('#ms-navigation li').slice(indexStart, indexStop);

            $navigationItems.removeClass('disabled completed danger warning info').addClass(status);
        }
    });

    $.fn[pluginName] = function (options) {

        return this.each(function () {

            if (!$.data(this, pluginName)) {

                $.data(this, pluginName, new MultistepForm(this, options));

            }

        });

    };

})(jQuery, window, document);