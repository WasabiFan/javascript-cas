//Define symbolic functions here:
//The apply has nothing to do with Function.prototype.apply, for now.

Global.sin = {
	apply: function(op, x){
		switch (x.constructor) {
			case Expression.Complex:
				// sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.Complex(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
			case Expresssion.NumericalReal:
				return Math.sin(x);
			default:
				throw("Unknown Type!: " + x.constructor);
		}
	},
	title: "Sine Function",
	description: "See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent"
};
Global.log = {
	apply: function (op, x) {
		switch (x.constructor) {
			case Expression.Complex:
				throw("Not ready Type!: " + x.constructor);
			case Expression.NumericalReal:
				return Math.log(x.value);
			default:
				throw("Unknown Type!: " + x.constructor);
		}
	},
	title: "Natural Logarithm",
	description: "Base e. See http://en.wikipedia.org/wiki/Natural_logarithm"
};
Global.atan2 = {
	apply: function(op, x) {
		switch (x[0].constructor) {
			case Expression.Complex:
				switch (x[1].constructor) {
					case Expression.Complex:
						throw("???");
					case Expression.NumericalReal:
						throw("???");
				}
			case Expression.NumericalReal:
				switch (x[1].constructor) {
					case Expression.Complex:
						throw("???");
					case Expression.NumericalReal:
						return new Expression.NumericalReal(Math.atan2(x[1], x[0]));
				}
		}
	},
	title: "Two argument arctangent function",
	description: "Arctan(x, y). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2"
}

Global.Gamma = {
	apply: function(op, x){
		function gammln(xx) {
		    var j;
		    var x, tmp, y, ser;
		    var cof = [
				57.1562356658629235,
				-59.5979603554754912,
				14.1360979747417471,
				-0.491913816097620199,
				0.339946499848118887e-4,
				0.465236289270485756e-4,
				-0.983744753048795646e-4,
				0.158088703224912494e-3,
				-0.210264441724104883e-3,
				0.217439618115212643e-3,
				-0.164318106536763890e-3,
				0.844182239838527433e-4,
				-0.261908384015814087e-4,
				0.368991826595316234e-5
			];
		    if (xx <= 0){
		        throw("bad arg in gammln");
		    }
		    y = x = xx;
		    tmp = x + 5.24218750000000000;
		    tmp = (x + 0.5) * Math.log(tmp) - tmp;
		    ser = 0.999999999999997092;
		    for (j = 0; j < 14; j++){
		        ser += cof[j] / ++y;
		    }
		    return tmp + Math.log(2.5066282746310005 * ser / x);
		}
		switch(x.constructor) {
			case Expression.Complex:
				return new Expression.Complex(5,3);
			case Expression.NumericalReal:
				x += 0;
				if (x === 0) {
			        return Global.Infinity;
			    } else if(x < 0) {
					return new Expression.NumericalReal(-Math.PI / (x * Math.sin(Math.PI * x) * Math.exp(gammln(-x))));
			    }
				return new Expression.NumericalReal(Math.exp(gammln(x)));
		}
	},
	
	title: "Gamma Function",
	description: "See http://en.wikipedia.org/wiki/Gamma_function"
}


Global.e = new Expression.Numerical(Math.E, 0);
Global.e.title = "e";
Global.e.description = "The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.";


Global.pi = new Expression.Numerical(Math.PI, 0);
Global.pi.title = "Pi";
Global.pi.description = "";



Global.Infinity = new Expression.Numerical(Infinity, 0);
Global.Infinity.title = "Infinity";
Global.Infinity.description = "";

Global.Zero = new Expression.Numerical(0, 0);
Global.Zero.title = "Zero";
Global.Zero.description = "Additive Identity";

Global.One = new Expression.Numerical(1, 0);
Global.One.title = "One";
Global.One.description = "Multiplicative Identity";

Global.i = new Expression.Numerical(0, 1);
Global.i.title = "Imaginary Unit";
Global.i.description = "A number which satisfies the property <m>i^2 = -1</m>.";