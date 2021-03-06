// -*- js -*-
/* Copyright 2013 by Ezer IT Consulting. All rights reserved. E-mail: claus@ezer.dk */

interface QuizFeatures {
    showFeatures : string[];
    requestFeatures : { name : string; usedropdown : boolean;} [];
    dontShowFeatures : string[];
}


enum ButtonSelection { SHOW, REQUEST, REQUEST_DROPDOWN, DONT_CARE, DONT_SHOW };

class ButtonsAndLabel {
    private showFeat	 : JQuery;
    private reqFeat	 : JQuery;
    private dcFeat	 : JQuery;
    private dontShowFeat : JQuery;
    private ddCheck	 : JQuery;
    private feat	 : JQuery;

    constructor(lab                       : string,
                private featName          : string,
                otype                     : string,
                select                    : ButtonSelection,
                private useDropDown       : boolean,
                private canShow           : boolean,
                private canRequest        : boolean,
                private canDisplayGrammar : boolean) {

        this.showFeat     = canShow ? $('<input type="radio" name="feat_{0}_{1}" value="show">'.format(otype,featName)) : $('<span></span>');
        this.reqFeat      = canRequest ? $('<input type="radio" name="feat_{0}_{1}" value="request">'.format(otype,featName)) : $('<span></span>');
        this.dcFeat       = $('<input type="radio" name="feat_{0}_{1}" value="dontcare">'.format(otype,featName));
        this.dontShowFeat = canDisplayGrammar ? $('<input type="radio" name="feat_{0}_{1}" value="dontshowfeat">'.format(otype,featName)) : $('<span></span>');
	this.feat         = $('<span>{0}</span>'.format(lab));
	
	switch (select) {
        case ButtonSelection.SHOW:             this.showFeat.prop('checked',true);     break;
        case ButtonSelection.REQUEST:
        case ButtonSelection.REQUEST_DROPDOWN: this.reqFeat.prop('checked',true);      break;
        case ButtonSelection.DONT_CARE:        this.dcFeat.prop('checked',true);       break;
        case ButtonSelection.DONT_SHOW:        this.dontShowFeat.prop('checked',true); break;
	}

        if (useDropDown) {
            this.ddCheck = $('<input type="checkbox" name="dd_{0}_{1}">'.format(otype,featName));
            this.ddCheck.prop('checked', select!=ButtonSelection.REQUEST);
        }
        else
            this.ddCheck = $('<span></span>'); // Empty space filler

        if (canRequest) {
            if (useDropDown) {
                this.ddCheck.prop('disabled', !this.reqFeat.prop('checked'));
                if (canShow)
                    this.showFeat.click(() => this.ddCheck.prop('disabled', true));
                this.reqFeat.click(() => this.ddCheck.prop('disabled', false));
                this.dcFeat.click(() => this.ddCheck.prop('disabled', true));
                if (canDisplayGrammar)
                    this.dontShowFeat.click(() => this.ddCheck.prop('disabled', true));
            }
        }
    }

    public getRow() : JQuery {
        var row : JQuery = $('<tr></tr>');
        var cell : JQuery;

        cell = $('<td></td>');
        cell.append(this.showFeat);
        row.append(cell);

        cell = $('<td></td>');
        cell.append(this.reqFeat);
        row.append(cell);

        cell = $('<td></td>');
        cell.append(this.dcFeat);
        row.append(cell);

        cell = $('<td></td>');
        cell.append(this.dontShowFeat);
        row.append(cell);

        cell = $('<td></td>');
        cell.append(this.ddCheck);
        row.append(cell);

        cell = $('<td class="leftalign"></td>');
        cell.append(this.feat);
        row.append(cell);

        return row;
    }

    public isSelected_showFeat() : boolean {
        if (this.canShow)
            return this.showFeat.prop('checked');
        else
            return false;
    }

    public isSelected_reqFeat() : boolean {
        if (this.canRequest)
            return this.reqFeat.prop('checked');
        else
            return false;
    }

    public isSelected_dontShowFeat() : boolean {
        if (this.canDisplayGrammar)
            return this.dontShowFeat.prop('checked');
        else
            return false;
    }

    public isSelected_ddCheck() : boolean {
        if (this.useDropDown)
            return this.ddCheck.prop('checked');
        else
            return false;
    }

    public getFeatName() : string {
        return this.featName;
    }
}

class PanelForOneOtype  {
    public visualBAL : ButtonsAndLabel;
    public allBAL    : ButtonsAndLabel[] = [];
    private panel    : JQuery = $('<table class="striped featuretable"></table>');
     
    constructor(otype : string, ptqf : PanelTemplQuizFeatures) {
        var useSavedFeatures : boolean = otype === ptqf.initialOtype;
        
        this.panel.append('<tr><th>{0}</th><th>{1}</th><th>{2}</th><th>{3}</th><th>{4}</th><th class="leftalign">{5}</th></tr>'
                          .format(localize('show'), 
                                  localize('request'), 
                                  localize('dont_care'), 
                                  localize('dont_show'), 
                                  localize('multiple_choice'), 
                                  localize('feature')));

        // First set up "visual" pseudo feature
        this.visualBAL = new ButtonsAndLabel(localize('visual'),'visual', otype,
                                             useSavedFeatures ? ptqf.getSelector('visual') : ButtonSelection.DONT_CARE,
                                             configuration.objHasSurface===otype && !!getFeatureSetting(otype,configuration.surfaceFeature).alternateshowrequestSql,
                                             true,
                                             configuration.objHasSurface===otype,
                                             false);

        this.panel.append(this.visualBAL.getRow());
         
        // Now handle genuine features
        var hasSurfaceFeature : boolean = otype === configuration.objHasSurface;
         
        var sg : SentenceGrammar = getSentenceGrammarFor(otype);


        var keylist : string[] = []; // Will hold sorted list of keys
        for (var key in getObjectSetting(otype).featuresetting) {
            // Ignore specified features
            if (getFeatureSetting(otype, key).ignoreShowRequest && (sg===null || !sg.containsFeature(key)))
                continue;
             
            // Ignore the genuine feature already presented as "visual"
            if (hasSurfaceFeature && key===configuration.surfaceFeature)
                continue;
            keylist.push(key);
        }
         
        // Next, loop through the keys in the sorted order
        for (var ix=0; ix<keylist.length; ++ix) {
            var key2 : string = keylist[ix];

            // This can be simplified when ignoreShowRequest is removed
            var ignoreShowRequest : boolean = getFeatureSetting(otype, key2).ignoreShowRequest;
            var ignoreShow : boolean = getFeatureSetting(otype, key2).ignoreShow;
            var ignoreRequest : boolean = getFeatureSetting(otype, key2).ignoreRequest;
            if (ignoreShowRequest) {
                ignoreShow = true;
                ignoreRequest = true;
            }

            var bal = new ButtonsAndLabel(getFeatureFriendlyName(otype, key2),
                                          key2,
                                          otype,
                                          useSavedFeatures ? ptqf.getSelector(key2) : ButtonSelection.DONT_CARE,
                                          !!getFeatureSetting(otype,key2).alternateshowrequestSql,
                                          !ignoreShow,
                                          !ignoreRequest,
                                          sg!==null && sg.containsFeature(key2));

            this.allBAL.push(bal);
            this.panel.append(bal.getRow());
         }
    }

    public hide() : void {
        this.panel.hide();
    }

    public show() : void {
        this.panel.show();
    }

    public getPanel() : JQuery {
        return this.panel;
    }
}


class PanelTemplQuizFeatures {
    public initialOtype  : string;
    private oldOtype     : string;
    private initialQf    : QuizFeatures;
    private panels       : PanelForOneOtype[] = [];  // Maps quiz object -> associated panel
    private visiblePanel : PanelForOneOtype;	
    private fpan         : JQuery = $('<div id="fpan"></div>');


    constructor(otype : string, qf : QuizFeatures, where : JQuery) {
	this.initialOtype = otype;
        this.initialQf = qf;

        where.append(this.fpan);
    }

    public populate(otype : string) : void {
        if (otype === this.oldOtype)
            return;

        this.oldOtype = otype;
        if (this.visiblePanel)
            this.visiblePanel.hide();

	this.visiblePanel = this.panels[otype];

	if (!this.visiblePanel) {
	    this.visiblePanel = new PanelForOneOtype(otype, this);
	    this.panels[otype] = this.visiblePanel;
            this.fpan.append(this.visiblePanel.getPanel());
	}

	this.visiblePanel.show();
    }

    public getSelector(feat : string) : ButtonSelection {
	if (this.initialQf) 
            for (var i=0; i<this.initialQf.showFeatures.length; ++i)
		if (this.initialQf.showFeatures[i]===feat)
		    return ButtonSelection.SHOW;
 
	if (this.initialQf)
            for (var i=0; i<this.initialQf.requestFeatures.length; ++i)
		if (this.initialQf.requestFeatures[i].name===feat)
		    return this.initialQf.requestFeatures[i].usedropdown ? ButtonSelection.REQUEST_DROPDOWN : ButtonSelection.REQUEST;
	
	if (this.initialQf && this.initialQf.dontShowFeatures)
            for (var i=0; i<this.initialQf.dontShowFeatures.length; ++i)
		if (this.initialQf.dontShowFeatures[i]===feat)
		    return ButtonSelection.DONT_SHOW;

	return ButtonSelection.DONT_CARE;
    }

    public noRequestFeatures() : boolean {
	if (!this.visiblePanel)
	    return true;
		
	if (this.visiblePanel.visualBAL.isSelected_reqFeat())
            return false;

        for (var i=0; i<this.visiblePanel.allBAL.length; ++i)
	    if (this.visiblePanel.allBAL[i].isSelected_reqFeat())
                return false;

	return true;
    }
	
    public noShowFeatures() : boolean {
	if (!this.visiblePanel)
	    return true;
		
	if (this.visiblePanel.visualBAL.isSelected_showFeat())
            return false;

        for (var i=0; i<this.visiblePanel.allBAL.length; ++i)
	    if (this.visiblePanel.allBAL[i].isSelected_showFeat())
                return false;

	return true;
    }


    public getInfo() : QuizFeatures {
        var qf : QuizFeatures =  {
            showFeatures     : [],
            requestFeatures  : [],
            dontShowFeatures : []
        };


	if (!this.visiblePanel)
	    return null;
		
	if (this.visiblePanel.visualBAL.isSelected_showFeat())
	    qf.showFeatures.push('visual');
	else if (this.visiblePanel.visualBAL.isSelected_reqFeat())
	    qf.requestFeatures.push({name : 'visual', usedropdown : this.visiblePanel.visualBAL.isSelected_ddCheck()});

        for (var i=0; i<this.visiblePanel.allBAL.length; ++i) {
            var bal : ButtonsAndLabel = this.visiblePanel.allBAL[i];

	    if (bal.isSelected_showFeat())
		qf.showFeatures.push(bal.getFeatName());
	    else if (bal.isSelected_reqFeat())
	        qf.requestFeatures.push({name : bal.getFeatName(), usedropdown : bal.isSelected_ddCheck()});
	    else if (bal.isSelected_dontShowFeat())
		qf.dontShowFeatures.push(bal.getFeatName());
	}
	return qf;
    }

    public isDirty() : boolean {
        var qfnow : QuizFeatures = this.getInfo();
        
        if (qfnow.showFeatures.length !== this.initialQf.showFeatures.length ||
            qfnow.requestFeatures.length !== this.initialQf.requestFeatures.length ||
            qfnow.dontShowFeatures.length !== this.initialQf.dontShowFeatures.length) {
            return true;
        }

        for (var i=0; i<qfnow.showFeatures.length; ++i)
            if (qfnow.showFeatures[i] !== this.initialQf.showFeatures[i]) {
            return true;
        }
        for (var i=0; i<qfnow.requestFeatures.length; ++i)
            if (qfnow.requestFeatures[i].name !== this.initialQf.requestFeatures[i].name ||
                qfnow.requestFeatures[i].usedropdown !== this.initialQf.requestFeatures[i].usedropdown) {
            return true;
        }
        
        for (var i=0; i<qfnow.dontShowFeatures.length; ++i)
            if (qfnow.dontShowFeatures[i] !== this.initialQf.dontShowFeatures[i]) {
            return true;
        }

        return false;
    }
}
 
