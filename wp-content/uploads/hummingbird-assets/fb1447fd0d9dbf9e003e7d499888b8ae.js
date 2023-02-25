/**handles:jmg-custom-js**/
jQuery(document).ready(function(){
	teamLink();
	teamSocialLinks();
	stemLinks();
	portfolioButton();
	footerTestimonials();
	talentLandingCTA();
	newsLetter();
	CTAcleanUp();
});

function CTAcleanUp(){
	if(jQuery(".cta").next().length != 0){
		jQuery(".cta").next().hide();
	}
}
function talentLandingCTA(){
	jQuery(".cta-button-scroll").click(function(){
		event.preventDefault();
		var windowWidth = jQuery( window ).width();

		if( windowWidth >= 1001){
			jQuery(".hidden-cta-form").slideToggle();
			jQuery(".gform_body input:eq(0)").focus();
		} else {
			jQuery(".hidden-cta-form").slideToggle();
			jQuery(".gform_body input:eq(0)").focus();
		}
		
	});
}
function newsLetter(){
	jQuery(".newsletter-signup").click(function(){
		event.preventDefault();
		jQuery("#newsletter-signup").slideToggle();
	});
}
function teamSocialLinks(){
	if(jQuery(".parent-pageid-274").length){
		var socialLinks = jQuery(".w-team-links").html();
		jQuery("<div class='social-me'>"+socialLinks+"</div>").appendTo(".w-team");
		jQuery(".social-me a").attr("target", "_blank");
	}
}
function footerTestimonials(){
	if(jQuery(".testimonial-wrapper").length){
		//jQuery(".testimonial-wrapper").parent().parent().hide();

		var testText = jQuery(".w-testimonial-text").text();
		var testAuthor = jQuery(".w-testimonial-person-name").text();
		var testCompany = jQuery(".w-testimonial-person-meta").text();
		var testPhoto = jQuery(".w-testimonial-person img").attr("src");

		jQuery("#footer-testimonial").html(
			"<div class='testimonial-photo'><img src='"+testPhoto+"'/></div>"+
			"<div class='testimonial-text'>"+testText+"</div>"+
			"<div class='testimonial-author'>"+testAuthor+", "+testCompany+"</div>");
	} else {
		jQuery("#footer-testimonial").css({
			  	"padding" : "20px 0px 0px 0px",
  				"border"  : "0px",
  				"float"   : "left"
		});
	}
}

function teamLink(){
	if(jQuery(".page-id-274").length){
		jQuery(".w-team").each(function(){
			var bioPageURL = jQuery(".w-team-link", this).attr("href");
			jQuery(".w-team-links", this).attr("data-url", bioPageURL);

			// var personInfo = jQuery(".w-team-content", this).html();

			// jQuery(".w-team-links", this).append("<div class='person'>"+personInfo+"</div>");

			//jQuery(".w-team-content", this).appendTo(".w-team-links", this);
		});

		jQuery(".w-team-links").click(function(){
			window.location.assign(jQuery(this).data('url'));
		});
	}
}

function stemLinks(){
	jQuery(".stem-link").mouseover(function(){
		var links = jQuery(".link-hider", this).html();
		var hoveredLinkWidth = jQuery(this).width();
		var hoveredLinkPosition = jQuery(this).position();
		var hoveredLinkPositionTop = hoveredLinkPosition.top;
		var hoveredLinkPositionLeft = hoveredLinkPosition.left + hoveredLinkWidth;
		
		jQuery(".link-bubble").empty().append(links).css({
			top: hoveredLinkPositionTop,
			left: hoveredLinkPositionLeft
		}).show();
		//console.log(hoveredLinkPositionTop);
	});
}

function portfolioButton(){
	if(jQuery(".page-id-3070").length){
		jQuery("#grid_load_more span").text("Load More Posts");
	} else {
		jQuery("#grid_load_more span").text("Load More Examples");
	}
}