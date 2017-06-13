# Rollbase Multistep Forms

This is a jQuery plugin that transforms standard portal page forms into multistep ones. jQuery must be included
on the portal page prior to plugin initialization.

## Portal Setup

The plugin uses prefixes to identify the components of the multistep form. Here's an example layout:

|Section Title|Contains|
|-|-|
|**Notification Message**|Notification Message|
|[multistep-header]Header|HTML Component|
|**System Section - Submission Form Begin**||
|[multistep]Company Information|Fields for Page 1|
|[multistep]More Information|Fields for Page 2|
|[multistep]Last Page|Fields for Page 3|
|**System Section - Submission Form End**||
|[multistep-footer]Footer|HTML Component|
|New Section|Script Component|

### Rollbase Section Prefixes
**`[multistep-header]`**

The contents of this section will be used as a static header at the top of the form.

**`[multistep]`**

Each section in the portal that begins with this prefix will become a new step in the form.

**`[multistep-footer]`**

The contents of this section will be used as a static footer at the bottom of the form.

Sections that act as pages (ones where the section title begins with `[multistep]`) can support multiple columns.
Each column will be transformed into a responsive one.

## Setup
The plugin, css file, and any additional libraries can be [included in the Header](https://documentation.progress.com/output/rb/doc/index.html#page/rb/creating-a-custom-header-and-footer.html) of the portal. If you'd rather
include it in them in the Script Component at the bottom of the portal page, that works too.

```html
<!-- rb.multistep.css -->
<link rel="stylesheet" type="text/css" href="{!#HOSTED_FILE.YOUR_HOSTED_FILE_ID}">
<!-- rb.multistep.js -->
<script src="{!#HOSTED_FILE.YOUR_HOSTED_FILE_ID}"></script>
```

For a better mobile experience, add the Viewport meta tag to the "HTML Header". This will change the default browser behavior to show the form at a more comfortable size on mobile devices.

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Example Usage

```javascript
$('form > table').multistepForm();
```

### Options
Available options are shown below. _(default values displayed)_ 

```javascript
$('form > table').multistepForm({
    labels: {
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit'
    },
    navigation: { // set to false for no navigation
        itemTemplate: '<span class="position">#position#</span><span class="title">#title#</span>',
        beforeNavigate: null
    },
    animation: {
        duration: 400 // set to false for no animations
    },
    progressTemplate: '#position#/#total#',
    beforeNext: null,
    beforePrevious: null,
    beforeSubmit: null,
    maxWidth: null
});
```

### API
```javascript
var ms = $('form > table').multistepForm().data('multistepForm');
```

`ms.navigate(index)` - Go to a specific step. _(doesn't execute beforeNext or beforePrevious callbacks)_

`ms.next()` - Go to the next step.

`ms.previous()` - Go back one step.

`ms.showStep(index)` - Go to a specific step. (0 indexed)

`ms.updateNavigation(status, index)` - Removes all status classes from the specified navigation item and then adds the specified status class.

### Validation
Form validation can be done quite easily using the [jQuery Validation Plugin](https://jqueryvalidation.org/) along
with `beforeNext`, `beforePrevious`, etc.

#### Automatic Rules
You can automatically make all required portal fields stop form navigation if they're blank. 

```javascript
$('form > table').multistepForm({
    beforeNext: function (e) {
        if (!isValid()) {
            e.preventDefault();
        }
    }
});

// add * to required field labels
$('.requiredInput').each(function () {
    var label = $('[for=' + $(this).attr('name') + ']');
    label.append('&nbsp;<strong>*</strong>');
});

// make required fields, required
$.validator.addClassRules('requiredInput', {
  required: true
});

function isValid () {
    var form = $('form');
    form.validate({
      errorPlacement: function(error, element) {
        // don't show any error messages for the required fields
        // because they're highlighted with CSS
        return true;
      },
      highlight: function(element) {
        $(element).parent('div').addClass('has-error');
      },
      unhighlight: function(element) {
        $(element).parent('div').removeClass('has-error');
      }
    });
    if (form.valid() == true){
        return true;
    }
    return false;
}
```

#### Custom Validation Rules and Messages
You can also set your own validation rules if you want to be a little more specific.

```javascript
function isValid () {
    var form = $("form");
    form.validate({
        rules: {
            First_Name: {
                required: true,
                minlength: 3,
            }
        },
        messages: {
            First_Name: {
                required: "First Name is required",
            }
        }
    });
    if (form.valid() == true){
        return true;
    }
    return false;
}
```