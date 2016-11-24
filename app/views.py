from flask import render_template, flash, request
from app import app
from flask import request
from wtforms import Form, validators, TextField, SelectField, TextAreaField, SelectMultipleField
from wtforms.fields.html5 import DateField
from wtforms_components import DateIntervalField, DateRange
from app import getdata
import json
import datetime
from flask_admin.form.widgets import DatePickerWidget




class ReusableForm(Form):
    name = TextAreaField(default='username', validators=[validators.required()])
    date = TextField('Start', default='Select date', validators=[validators.required()])
    languages = SelectMultipleField('Languages', choices=[('en', 'English'), ('it', 'Italian'), ('nl','Nederlands'), ('sv','Swedish'),('ceb','Cebuano'),('de','German'),('fr', 'French'),('ru', 'Russian'),('es','Spanish')], validators=[validators.required()])


@app.route('/', methods=['GET', 'POST'])
@app.route('/index')


def index():


    supported_languages = ['en','it','de','nl','sv','ceb','de','fr','ru','es']
    langs = []
    langs.append(request.accept_languages.best_match(supported_languages))
    
    form = ReusableForm(request.form)

    data, form_input, name = getdata.acquireTrends(langs)
    
    flash(name.replace('_',' '))



    if request.method == 'POST':
        if form.validate():

            start, end = request.form['date'].split("-")
            name = request.form['name']

            langs =  form.languages.data


            s = start.replace("/", "")
            e = end.replace("/", "")

            startDate = s[-5:-1]+s[:2]+s[2:4]
            endDate = e[-4:]+e[1:3]+e[3:5]
            
            flash(name)
            data, errors = getdata.launchQuery(name, startDate, endDate, langs)

            if not data:
                flash("No data, retry")
                flash(errors)
        else:
            flash('All the form fields are required. ')

    return render_template('index.html', form=form, data=data, name=name, query=form_input)




@app.route('/trends')

def trends():

    form = ReusableForm(request.form)


    return render_template('index.html',form=form, data=data, name=name, query=title)




