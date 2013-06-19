(function($) {
    $.fn.swap = function(options) {
    	var defaults = {
    	   target: null,
    	   direction: 'left',
    	   duration: 500,
    	   complete: null
    	},
    	settings = $.extend({}, defaults, options);
    	
        this.each(function() {
            var $this = $(this);
            
            // Prepare
            $this.css("position", "relative");
            $this.css("overflow", "hidden");
            
            var $target = $('.' + settings.target, this);
            var $current = $this.children(':visible');
            
            var width = $this.width();
            var currentHeight = $this.height();
            $this.css("height", currentHeight);
            
            $target.css("position", "absolute");
            $target.css("top", 0);
            $target.css("left", 0);
            $target.css('width', width);
            $target.css('opacity', 0.0);
            
            $current.css("position", "absolute");
            $current.css("left", 0);
            $current.css('width', width);
            $current.css("top", 0);
            
            $target.show();
            
            var targetAnimation = 'slide-in-right';
            var currentAnimation = 'slide-out-left';
            
            if (settings.direction == 'right') {
                targetAnimation = 'slide-in-left';
                currentAnimation = 'slide-out-right';
            }
            
            var newHeight = $target.height();
            
            // Animate
            StatusBuilder.transition($this[0], {height: newHeight + 'px'}, {duration: 500, complete: function() {
                $this.height(newHeight);
                $this.css('height', 'auto');
            }});
            StatusBuilder.animate($current[0], currentAnimation, 500, function() {
                $current.hide();
                $current.css("position", "relative");
                $current.css("left", 0);
                $current.css("top", 0);
                $current.css('width', 'auto');
                $current.css('opacity', 1.0);
            });
            StatusBuilder.animate($target[0], targetAnimation, 500, function() {
                $target.css("position", "relative");
                $target.css("left", 0);
                $target.css("top", 0);
                $target.css('width', 'auto');
                $target.css('opacity', 1.0);
            });
        });
        return this;
    };
})(jQuery);